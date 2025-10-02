<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Attendance;
use App\Models\SecondSemesterAttendance;

class FinalGradesController extends Controller
{
    /**
     * Get final grades data for faculty
     */
    public function getFinalGrades(Request $request)
    {
        $semester = $request->get('semester', '2025-2026 1st semester');
        
        // Clear cache if force refresh is requested
        if ($request->get('force_refresh')) {
            \Cache::forget("final_grades_{$semester}");
        }
        
        // Check if we have cached data
        $cacheKey = "final_grades_{$semester}";
        if (!$request->get('force_refresh') && \Cache::has($cacheKey)) {
            return response()->json(\Cache::get($cacheKey));
        }
        
        try {
            // Get all cadets
            $cadets = User::where('role', 'user')->get();
            
            $finalGradesData = [];
            
            foreach ($cadets as $cadet) {
                // Get Common Module Grade
                $commonModuleGrade = $this->getCommonModuleGrade($cadet->id, $semester);
                
                // Get ROTC Grade (sum of aptitude_30 + attendance_30 + subject_prof_score)
                $rotcGrade = $this->getROTCGrade($cadet->id, $semester);
                
                // Calculate Final Grade and Equivalent Grade based on semester
                if ($semester === '2025-2026 1st semester') {
                    // 1st semester: Final Grade = round((Common Module + ROTC) / 2)
                    $finalGrade = (int) round(($commonModuleGrade + $rotcGrade) / 2);
                } else {
                    // 2nd semester: Final Grade = ROTC Grade only (whole number)
                    $finalGrade = (int) round($rotcGrade);
                }

                // Equivalent grade based on final grade percentage (figure 2 mapping)
                $equivalentGrade = $this->computeEquivalentFromPercent($finalGrade);
                
                // Compute remarks consistent with figure 2
                $remarks = $this->computeRemarks($finalGrade, $equivalentGrade);

                $finalGradesData[] = [
                    'id' => $cadet->id,
                    'user_id' => $cadet->id,
                    'first_name' => $cadet->first_name,
                    'last_name' => $cadet->last_name,
                    'middle_name' => $cadet->middle_name,
                    'platoon' => $cadet->platoon,
                    'company' => $cadet->company,
                    'battalion' => $cadet->battalion,
                    'role' => $cadet->role,
                    'common_module_grade' => $commonModuleGrade,
                    'rotc_grade' => $rotcGrade,
                    'final_grade' => $finalGrade,
                    'equivalent_grade' => $equivalentGrade,
                    'remarks' => $remarks,
                    'semester' => $semester
                ];
            }
            
            // Cache the results for 5 minutes
            \Cache::put($cacheKey, $finalGradesData, 300);
            
            return response()->json($finalGradesData);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch final grades data'], 500);
        }
    }
    
    /**
     * Post grades to userGrades table
     */
    public function postGrades(Request $request)
    {
        $request->validate([
            'semester' => 'required|string',
            'grades' => 'required|array',
            'grades.*.user_id' => 'required|integer|exists:users,id',
            'grades.*.equivalent_grade' => 'required|numeric',
            'grades.*.remarks' => 'required|string',
            'grades.*.final_grade' => 'required|integer',
        ]);

        $semester = $request->input('semester');
        $grades = $request->input('grades');

        try {
            DB::transaction(function () use ($grades, $semester) {
                foreach ($grades as $gradeData) {
                    // Update or create user grade record
                    DB::table('user_grades')->updateOrInsert(
                        [
                            'user_id' => $gradeData['user_id'],
                            'semester' => $semester
                        ],
                        [
                            'equivalent_grade' => $gradeData['equivalent_grade'],
                            'remarks' => $gradeData['remarks'],
                            'final_grade' => $gradeData['final_grade'],
                            'updated_at' => now(),
                            'created_at' => now()
                        ]
                    );
                }
            });

            // Clear cache after posting
            \Cache::forget("final_grades_{$semester}");
            \Cache::forget("user_grades_{$semester}");

            return response()->json([
                'success' => true,
                'message' => 'Grades posted successfully',
                'posted_count' => count($grades)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to post grades: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Map percent to equivalent per official table.
     *
     * 1.00 — 96.50–100
     * 1.25 — 93.50–96.49
     * 1.50 — 90.50–93.49
     * 1.75 — 87.50–90.49
     * 2.00 — 84.50–87.49
     * 2.25 — 81.50–84.49
     * 2.50 — 78.50–81.49
     * 2.75 — 75.50–78.49
     * 3.00 — 75.00–75.49
     * 5.00 — < 75.00
     * (4.00, INC, D, UD, FDA are statuses, not derived from percent.)
     */
    private function computeEquivalentFromPercent($percent)
    {
        $p = (float) $percent;
        if ($p >= 96.5) return 1.00;
        if ($p >= 93.5) return 1.25;
        if ($p >= 90.5) return 1.50;
        if ($p >= 87.5) return 1.75;
        if ($p >= 84.5) return 2.00;
        if ($p >= 81.5) return 2.25;
        if ($p >= 78.5) return 2.50;
        if ($p >= 75.5) return 2.75;
        if ($p >= 75.0) return 3.00;
        return 5.00;
    }

    /**
     * Compute remark string given final percent and equivalent grade.
     */
    private function computeRemarks($finalPercent, $equivalent)
    {
        $eq = (float) $equivalent;
        if ($eq === 5.00) return 'Failed';
        if ($eq === 4.00) return 'Conditional Passed';
        return 'Passed';
    }

    /**
     * Get Common Module Grade for a user
     */
    private function getCommonModuleGrade($userId, $semester)
    {
        $commonModule = DB::table('first_semester_common_grade_module')
            ->where('user_id', $userId)
            ->where('semester', $semester)
            ->first();
            
        return $commonModule ? (float) $commonModule->common_module_grade : 0;
    }
    
    /**
     * Get ROTC Grade (sum of aptitude_30 + attendance_30 + subject_prof_score)
     * For 2025-2026 1st semester: Subject Prof = 40%, Attendance = 30%, Aptitude = 30%
     */
    private function getROTCGrade($userId, $semester)
    {
        $rotcGrade = 0;
        
        if ($semester === '2025-2026 1st semester') {
            // Get aptitude_30 from first_semester_aptitude
            $aptitude = DB::table('first_semester_aptitude')
                ->where('cadet_id', $userId)
                ->first();
            $aptitude30 = $aptitude ? (int) $aptitude->aptitude_30 : 0;
            
            // Get attendance_30 from first_semester_attendance
            $attendance = DB::table('first_semester_attendance')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendance30 = $attendance ? (int) $attendance->attendance_30 : 0;
            
            // Get exam scores from first_semester_exam_scores for the requested semester
            $exam = DB::table('first_semester_exam_scores')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            
            // Calculate Subject Prof score using stored average (respects dynamic Max)
            $subjectProfScore = 0;
            if ($exam) {
                $average = $exam->average ? (float) $exam->average : 0.0;
                $subjectProfScore = min(40, round($average * 0.40)); // 40% weighting, capped at 40
            }
            
            $rotcGrade = $aptitude30 + $attendance30 + $subjectProfScore;
            
        } else if ($semester === '2026-2027 2nd semester') {
            // For second semester, use second semester tables
            // Get aptitude_30 from second_semester_aptitude
            $aptitude = DB::table('second_semester_aptitude')
                ->where('cadet_id', $userId)
                ->where('semester', $semester)
                ->first();
            $aptitude30 = $aptitude ? (int) $aptitude->aptitude_30 : 0;
            
            // Get attendance_30 from second_semester_attendance
            $attendance = DB::table('second_semester_attendance')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendance30 = $attendance ? (int) $attendance->attendance_30 : 0;
            
            // Get subject_prof directly from second_semester_exam_scores
            $exam = DB::table('second_semester_exam_scores')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $subjectProfScore = $exam ? (int) $exam->subject_prof : 0;
            
            // ROTC Grade = Aptitude (30) + Attendance (30) + Subject Prof (40)
            $rotcGrade = round($aptitude30 + $attendance30 + $subjectProfScore);
        }
        
        return $rotcGrade;
    }
    
    /**
     * Update Common Module Grade
     */
    public function updateCommonModuleGrade(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'common_module_grade' => 'required|numeric|min:0|max:100',
            'semester' => 'required|string'
        ]);
        
        try {
            $userId = $request->user_id;
            $grade = $request->common_module_grade;
            $semester = $request->semester;
            
            // Update or create common module grade
            DB::table('first_semester_common_grade_module')
                ->updateOrInsert(
                    ['user_id' => $userId, 'semester' => $semester],
                    [
                        'common_module_grade' => $grade,
                        'updated_at' => now()
                    ]
                );
            
            return response()->json([
                'success' => true,
                'message' => 'Common module grade updated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update common module grade'
            ], 500);
        }
    }
    
    /**
     * Get Common Module data
     */
    public function getCommonModule(Request $request)
    {
        $semester = $request->get('semester', '2025-2026 1st semester');
        
        try {
            $commonModuleData = DB::table('first_semester_common_grade_module')
                ->where('semester', $semester)
                ->get()
                ->keyBy('user_id');
                
            return response()->json($commonModuleData);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch common module data'], 500);
        }
    }
}