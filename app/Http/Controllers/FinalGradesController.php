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
            // Get all cadets (exclude archived)
            $cadets = User::where('role', 'user')
                ->where('archived', false)
                ->get();
            
            $finalGradesData = [];
            
            foreach ($cadets as $cadet) {
                // Get Common Module Grade
                $commonModuleGrade = $this->getCommonModuleGrade($cadet->id, $semester);
                
                // Get ROTC Grade (sum of aptitude_30 + attendance_30 + subject_prof_score)
                $rotcGrade = $this->getROTCGrade($cadet->id, $semester);

                // Also compute a component breakdown for transparency/debugging in UI
                if ($semester === '2025-2026 1st semester') {
                    $aptitudeScoreDbg = $this->calculateAptitudePercentage($cadet->id, $semester);
                    $attendanceScoreDbg = $this->calculateAttendancePercentage($cadet->id, $semester);
                    $examScoreDbg = $this->calculateExamPercentage($cadet->id, $semester);
                } else {
                    $aptitudeScoreDbg = $this->calculateSecondSemesterAptitude($cadet->id, $semester);
                    $attendanceScoreDbg = $this->calculateSecondSemesterAttendance($cadet->id, $semester);
                    $examScoreDbg = $this->calculateSecondSemesterExam($cadet->id, $semester);
                }
                
                // Get attendance data for this cadet
                $attendanceData = $this->getAttendanceData($cadet->id, $semester);
                
                // Get aptitude data for 2nd semester calculations
                $aptitudeData = null;
                $examData = null;
                if ($semester === '2025-2026 2nd semester') {
                    $aptitudeData = $this->getAptitudeData($cadet->id, $semester);
                    $examData = $this->getExamData($cadet->id, $semester);
                }
                
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
                    'rotc_breakdown' => [
                        'aptitude_30' => $aptitudeScoreDbg,
                        'attendance_30' => $attendanceScoreDbg,
                        'subject_prof_40' => $examScoreDbg,
                        'sum' => ($aptitudeScoreDbg + $attendanceScoreDbg + $examScoreDbg)
                    ],
                    'final_grade' => $finalGrade,
                    'equivalent_grade' => $equivalentGrade,
                    'remarks' => $remarks,
                    'semester' => $semester,
                    // Include attendance data for frontend calculations
                    'attendance_data' => $attendanceData,
                    // Include aptitude and exam data for 2nd semester
                    'aptitude_data' => $aptitudeData,
                    'exam_data' => $examData
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
            'grades.*.final_grade' => 'required|integer',
        ]);

        $semester = $request->input('semester');
        $grades = $request->input('grades');

        try {
            DB::transaction(function () use ($grades, $semester) {
                foreach ($grades as $gradeData) {
                    // Auto-compute remarks based on equivalent grade
                    $equivalentGrade = (float) $gradeData['equivalent_grade'];
                    if ($equivalentGrade === 4.00) {
                        $remarks = 'Incomplete';
                    } elseif ($equivalentGrade > 4.00) {
                        $remarks = 'Failed';
                    } else {
                        $remarks = 'Passed';
                    }
                    
                    // Update or create user grade record
                    DB::table('user_grades')->updateOrInsert(
                        [
                            'user_id' => $gradeData['user_id'],
                            'semester' => $semester
                        ],
                        [
                            'equivalent_grade' => $gradeData['equivalent_grade'],
                            'remarks' => $remarks,
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
        if ($eq === 4.00) return 'Incomplete';
        if ($eq > 4.00) return 'Failed';
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
     * Now calculates values dynamically like the frontend does
     */
    private function getROTCGrade($userId, $semester)
    {
        $rotcGrade = 0;
        
        if ($semester === '2025-2026 1st semester') {
            // Calculate aptitude from weekly data like frontend does
            $aptitudeScore = $this->calculateAptitudePercentage($userId, $semester);
            
            // Calculate attendance from weekly data like frontend does
            $attendanceScore = $this->calculateAttendancePercentage($userId, $semester);
            
            // Calculate exam score from stored values
            $examScore = $this->calculateExamPercentage($userId, $semester);
            
            $rotcGrade = $aptitudeScore + $attendanceScore + $examScore;
            
        } else if ($semester === '2025-2026 2nd semester') {
            // For second semester, use second semester calculation logic
            $aptitudeScore = $this->calculateSecondSemesterAptitude($userId, $semester);
            $attendanceScore = $this->calculateSecondSemesterAttendance($userId, $semester);
            $examScore = $this->calculateSecondSemesterExam($userId, $semester);
            
            $rotcGrade = $aptitudeScore + $attendanceScore + $examScore;
        }
        
        return round($rotcGrade);
    }
    
    /**
     * Calculate aptitude percentage for first semester (matches frontend logic)
     */
    private function calculateAptitudePercentage($userId, $semester)
    {
        $aptitude = DB::table('first_semester_aptitude')
            ->where('cadet_id', $userId)
            ->first();
            
        if (!$aptitude) return 0;
        
        // Get weekly merit and demerit data - 1st semester uses 10 weeks
        $merits = [];
        $demerits = [];
        
        for ($i = 1; $i <= 10; $i++) {
            $merit = $aptitude->{"merits_week_$i"};
            $demerit = $aptitude->{"demerits_week_$i"};
            
            $merits[] = ($merit === null || $merit === '') ? 0 : (int) $merit;
            $demerits[] = ($demerit === null || $demerit === '' || $demerit === '-') ? 0 : (int) $demerit;
        }
        
        // Calculate like frontend: total merits = maxPossible - total demerits, then scale to 30 points
        $totalDemerits = array_sum($demerits);
        $maxPossible = 10 * 10; // 100 for 10 weeks
        $totalMerits = max(0, $maxPossible - $totalDemerits);
        
        // Convert to 30-point scale using (total/100)*30 formula like frontend
        $aptitude30 = min(30, max(0, round(($totalMerits / 100) * 30)));
        
        return $aptitude30;
    }
    
    /**
     * Calculate attendance percentage for first semester (matches frontend logic)
     */
    private function calculateAttendancePercentage($userId, $semester)
    {
        $attendance = DB::table('first_semester_attendance')
            ->where('user_id', $userId)
            ->where('semester', $semester)
            ->first();
            
        if (!$attendance) return 0;
        
        // Count present weeks from weekly columns (week_1 to week_10 for first semester)
        $presentCount = 0;
        $weekLimit = 10; // First semester has 10 weeks
        
        for ($i = 1; $i <= $weekLimit; $i++) {
            $weekColumn = "week_{$i}";
            if (isset($attendance->$weekColumn) && $attendance->$weekColumn) {
                $presentCount++;
            }
        }
        
        // Calculate percentage and convert to 30-point scale
        $percentage = ($presentCount / $weekLimit) * 30;
        return min(30, round($percentage));
    }
    
    /**
     * Calculate exam percentage for first semester
     */
    private function calculateExamPercentage($userId, $semester)
    {
        $exam = DB::table('first_semester_exam_scores')
            ->where('user_id', $userId)
            ->where('semester', $semester)
            ->first();
            
        if (!$exam) return 0;
        
        // First semester no longer uses midterm; only final exam is considered
        $final = $exam->final_exam ? (float) $exam->final_exam : 0;
        
        // If no final exam score, return 0
        if ($final == 0) return 0;
        
        // For 1st semester: use final exam directly (assumed out of 100), then convert to 40-point scale
        // Aligns with facultyExams: subject_prof = round((final / maxFinal) * 100 * 0.40); with default maxFinal=100
        $average = $final; // out of 100
        return min(40, round($average * 0.40));
    }
    
    /**
     * Calculate aptitude for second semester
     */
    private function calculateSecondSemesterAptitude($userId, $semester)
    {
        // Handle semester name variations in database
        $aptitude = DB::table('second_semester_aptitude')
            ->where('cadet_id', $userId)
            ->whereIn('semester', ['2025-2026 2nd semester'])
            ->first();
            
        if (!$aptitude) return 0;
        
        // Calculate like frontend: start with max possible (150), subtract total demerits
        $totalDemerits = 0;
        
        for ($i = 1; $i <= 15; $i++) {
            $demerit = $aptitude->{"demerits_week_$i"} ?? 0;
            $demerit = ($demerit === null || $demerit === '' || $demerit === '-') ? 0 : (int) $demerit;
            $totalDemerits += $demerit;
        }
        
        // Calculate exactly like frontend: total_merits = max_possible - total_demerits, then scale to 30
        // 1st semester: 10 weeks * 10 points = 100 max possible
        // 2nd semester: 15 weeks * 10 points = 150 max possible
        $isFirstSemester = strpos($semester, '1st semester') !== false;
        $weeksCount = $isFirstSemester ? 10 : 15;
        $maxPossible = $weeksCount * 10;
        $totalMerits = max(0, $maxPossible - $totalDemerits);
        $aptitude30 = min(30, max(0, round(($totalMerits / $maxPossible) * 30)));
        
        return $aptitude30;
    }
    
    /**
     * Calculate attendance for second semester
     */
    private function calculateSecondSemesterAttendance($userId, $semester)
    {
        $attendance = DB::table('second_semester_attendance')
            ->where('user_id', $userId)
            ->where('semester', $semester)
            ->first();
            
        if (!$attendance) return 0;
        
        // If attendance_30 is already calculated, use it
        if ($attendance->attendance_30 > 0) {
            return (int) $attendance->attendance_30;
        }
        
        // Otherwise, count present weeks from weekly columns (week_1 to week_15 for second semester)
        $presentCount = 0;
        $weekLimit = 15; // Second semester has 15 weeks
        
        for ($i = 1; $i <= $weekLimit; $i++) {
            $weekColumn = "week_{$i}";
            if (isset($attendance->$weekColumn) && $attendance->$weekColumn) {
                $presentCount++;
            }
        }
        
        // Calculate percentage and convert to 30-point scale
        $percentage = ($presentCount / $weekLimit) * 30;
        return min(30, round($percentage));
    }
    
    /**
     * Calculate exam score for second semester
     */
    private function calculateSecondSemesterExam($userId, $semester)
    {
        // Handle semester name variations in database
        $exam = DB::table('second_semester_exam_scores')
            ->where('user_id', $userId)
            ->whereIn('semester', ['2025-2026 2nd semester'])
            ->first();
            
        if (!$exam) return 0;
        
        $midterm = $exam->midterm_exam ? (float) $exam->midterm_exam : 0;
        $final = $exam->final_exam ? (float) $exam->final_exam : 0;
        
        // For second semester: use average of midterm and final exam, then convert to 40-point scale
        if ($midterm == 0 && $final == 0) return 0;
        
        $average = ($midterm + $final) / 2;
        return min(40, round($average * 0.40));
    }
    
    /**
     * Get attendance data for frontend consumption
     */
    private function getAttendanceData($userId, $semester)
    {
        if ($semester === '2025-2026 1st semester') {
            $attendance = DB::table('first_semester_attendance')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
                
            if (!$attendance) {
                return [
                    'weekly_attendance' => [],
                    'weeks_present' => 0,
                    'attendance_30' => 0,
                    'percentage' => 0
                ];
            }
            
            // Build weekly attendance data (week_1 to week_10 for first semester)
            $weeklyAttendance = [];
            $weekLimit = 10; // First semester has 10 weeks
            $presentCount = 0;
            
            for ($i = 1; $i <= $weekLimit; $i++) {
                $weekColumn = "week_{$i}";
                $isPresent = isset($attendance->$weekColumn) && $attendance->$weekColumn;
                $weeklyAttendance[$i] = $isPresent;
                if ($isPresent) $presentCount++;
            }
            
            $attendancePercentage = ($presentCount / $weekLimit) * 100;
            $attendance30 = ($presentCount / $weekLimit) * 30;
            
            return [
                'weekly_attendance' => $weeklyAttendance,
                'weeks_present' => $presentCount,
                'attendance_30' => round($attendance30),
                'percentage' => round($attendancePercentage, 2)
            ];
            
        } else {
            // Second semester logic
            $attendance = DB::table('second_semester_attendance')
                ->where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
                
            if (!$attendance) {
                return [
                    'weekly_attendance' => [],
                    'weeks_present' => 0,
                    'attendance_30' => 0,
                    'percentage' => 0
                ];
            }
            
            // Build weekly attendance data (week_1 to week_15 for second semester)
            $weeklyAttendance = [];
            $weekLimit = 15;
            $presentCount = 0;
            
            for ($i = 1; $i <= $weekLimit; $i++) {
                $weekColumn = "week_{$i}";
                $isPresent = isset($attendance->$weekColumn) && $attendance->$weekColumn;
                $weeklyAttendance[$i] = $isPresent;
                if ($isPresent) $presentCount++;
            }
            
            $attendancePercentage = ($presentCount / $weekLimit) * 100;
            $attendance30 = ($presentCount / $weekLimit) * 30;
            
            return [
                'weekly_attendance' => $weeklyAttendance,
                'weeks_present' => $presentCount,
                'attendance_30' => round($attendance30),
                'percentage' => round($attendancePercentage, 2)
            ];
        }
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
    
    /**
     * Get aptitude data for 2nd semester frontend consumption
     */
    private function getAptitudeData($userId, $semester)
    {
        if ($semester !== '2025-2026 2nd semester') {
            return null;
        }
        
        // Handle semester name variations in database
        $aptitude = DB::table('second_semester_aptitude')
            ->where('cadet_id', $userId)
            ->whereIn('semester', ['2025-2026 2nd semester'])
            ->first();
            
        if (!$aptitude) {
            return [
                'aptitude_30' => 0,
                'total_merits' => 0,
                'merits_array' => [],
                'demerits_array' => []
            ];
        }
        
        // Build weekly merit and demerit arrays for 15 weeks
        $meritsArray = [];
        $demeritsArray = [];
        $totalDemerits = 0;
        
        for ($i = 1; $i <= 15; $i++) {
            $merit = $aptitude->{"merits_week_$i"} ?? 0;
            $demerit = $aptitude->{"demerits_week_$i"} ?? 0;
            
            $merit = ($merit === null || $merit === '' || $merit === '-') ? 0 : (int) $merit;
            $demerit = ($demerit === null || $demerit === '' || $demerit === '-') ? 0 : (int) $demerit;
            
            $meritsArray[] = $merit;
            $demeritsArray[] = $demerit;
            
            $totalDemerits += $demerit;
        }
        
        // Calculate aptitude_30 using the same logic as frontend: total_merits = max_possible - total_demerits
        // 1st semester: 10 weeks * 10 points = 100 max possible
        // 2nd semester: 15 weeks * 10 points = 150 max possible
        $isFirstSemester = strpos($semester, '1st semester') !== false;
        $weeksCount = $isFirstSemester ? 10 : 15;
        $maxPossible = $weeksCount * 10;
        $totalMerits = max(0, $maxPossible - $totalDemerits);
        $aptitude30 = min(30, max(0, round(($totalMerits / $maxPossible) * 30)));
        
        return [
            'aptitude_30' => $aptitude30,
            'total_merits' => $totalMerits,
            'merits_array' => $meritsArray,
            'demerits_array' => $demeritsArray
        ];
    }
    
    /**
     * Get exam data for 2nd semester frontend consumption
     */
    private function getExamData($userId, $semester)
    {
        if ($semester !== '2025-2026 2nd semester') {
            return null;
        }
        
        // Handle semester name variations in database
        $exam = DB::table('second_semester_exam_scores')
            ->where('user_id', $userId)
            ->whereIn('semester', ['2025-2026 2nd semester'])
            ->first();
            
        if (!$exam) {
            return [
                'midterm_exam' => 0,
                'final_exam' => 0
            ];
        }
        
        return [
            'midterm_exam' => $exam->midterm_exam ?? 0,
            'final_exam' => $exam->final_exam ?? 0
        ];
    }
}