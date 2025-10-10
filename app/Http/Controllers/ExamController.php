<?php

namespace App\Http\Controllers;

use App\Models\ExamScore;
use App\Models\SecondSemesterExamScore;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    /**
     * Get the appropriate exam score model based on semester.
     *
     * @param  string  $semester
     * @return string
     */
    private function getExamScoreModelForSemester($semester)
    {
        if (strpos($semester, '1st semester') !== false) {
            return ExamScore::class;
        } elseif (strpos($semester, '2nd semester') !== false) {
            return SecondSemesterExamScore::class;
        }
        return ExamScore::class; // Default to first semester
    }

    /**
     * Get exam scores for all cadets for a specific semester.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExamScores(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $examScoreModel = $this->getExamScoreModelForSemester($semester);
        
        // Get all users with role 'user' (cadets)
        // NOTE: Do not filter users by semester here. A user's semester field may be empty
        // or not aligned with the requested view, which would incorrectly return 0 cadets.
        // We fetch all approved cadets and then look up their exam scores for the requested semester.
        $query = User::where('role', 'user')
            ->where('archived', false);
        
        $users = $query->get();
        $examData = [];

        foreach ($users as $user) {
            // Get exam scores for this user and semester
            $examScore = $examScoreModel::where('user_id', $user->id)
                ->where('semester', $semester)
                ->first();
            
            $finalExam = $examScore ? $examScore->final_exam : '';
            $midtermExam = $examScore ? $examScore->midterm_exam : '';
            // For first semester the column is subj_prof_40; for second it's subject_prof
            if ($semester === '2025-2026 1st semester') {
                $subjectProf = $examScore ? ($examScore->subj_prof_40 ?? null) : null;
            } else {
                $subjectProf = $examScore ? ($examScore->subject_prof ?? null) : null;
            }
            
            // Get aptitude and attendance data for Final Grade calculation
            $aptitude30 = 0;
            $attendance30 = 0;
            $finalGrade = 0;
            
            if ($semester === '2025-2026 2nd semester') {
                // Get aptitude_30 from second_semester_aptitude
                $aptitude = DB::table('second_semester_aptitude')
                    ->where('cadet_id', $user->id)
                    ->whereIn('semester', ['2025-2026 2nd semester', '2026-2027 2nd semester']) // Handle both semester formats
                    ->first();
                $aptitude30 = $aptitude ? (float) $aptitude->aptitude_30 : 0;
                
                // Get attendance_30 from second_semester_attendance
                $attendance = DB::table('second_semester_attendance')
                    ->where('user_id', $user->id)
                    ->where('semester', $semester)
                    ->first();
                $attendance30 = $attendance ? (int) $attendance->attendance_30 : 0;
                
                // Calculate Final Grade: aptitude_30 + attendance_30 + subject_prof
                $finalGrade = round($aptitude30 + $attendance30 + ($subjectProf ?? 0));
            }
            
            // Calculate average based on semester
            if ($semester === '2025-2026 2nd semester') {
                // For 2nd semester: average of normalized midterm and final scores
                $final = ($finalExam === '' || $finalExam === null) ? 0 : (float) $finalExam;
                $midterm = ($midtermExam === '' || $midtermExam === null) ? 0 : (float) $midtermExam;
                
                // Use dynamic max scores (default to 100 if not specified)
                $maxFinalScore = 100; // This should come from the request, but default to 100
                $maxMidtermScore = 100; // This should come from the request, but default to 100
                
                $finalNorm = $maxFinalScore > 0 ? ($final / $maxFinalScore) : 0;
                $midNorm = $maxMidtermScore > 0 ? ($midterm / $maxMidtermScore) : 0;
                $average = (($finalNorm + $midNorm) / 2) * 100;
                
                // Format to 2 decimal places for 2nd semester
                $average = round($average, 2);
            } else {
                // For 1st semester: (Final / 100) * 100 = Final score directly
                $average = ($finalExam === '' || $finalExam === null) ? 0 : (float) $finalExam;
                // Format to whole number for 1st semester
                $average = round($average);
            }
            
            $examData[] = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'platoon' => $user->platoon ?? '',
                'company' => $user->company ?? '',
                'battalion' => $user->battalion ?? '',
                // Return empty string when no score so UI shows blank inputs, not 0
                'final_exam' => $finalExam,
                'midterm_exam' => $midtermExam,
                'average' => $average,
                'subject_prof' => $subjectProf, // 1st sem maps subj_prof_40
                'aptitude_30' => $aptitude30,
                'attendance_30' => $attendance30,
                'final_grade' => $finalGrade,
            ];
        }

        return response()->json($examData);
    }

    /**
     * Save exam scores for cadets for a specific semester.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function saveExamScores(Request $request)
    {
        try {
            $semester = $request->input('semester');
            $maxFinal = (int) ($request->input('max_final', 100));
            $maxMidterm = (int) ($request->input('max_midterm', 100));
            if ($maxFinal <= 0) { $maxFinal = 100; }
            if ($maxMidterm <= 0) { $maxMidterm = 100; }
            
            \Log::info('Exam scores save request', [
                'semester' => $semester,
                'max_final' => $maxFinal,
                'max_midterm' => $maxMidterm,
                'scores_count' => count($request->input('scores', [])),
            ]);
            
            // Validation rules use dynamic max score for both midterm and final
            $finalExamMax = $maxFinal;
            $midtermExamMax = $maxMidterm;
            
            // Validation rules depend on semester
            $validationRules = [
                'scores' => 'required|array',
                'scores.*.id' => 'required|exists:users,id',
                'scores.*.final_exam' => "nullable|numeric|min:0|max:{$finalExamMax}",
                'semester' => 'required|string',
                'max_final' => 'nullable|integer|min:1',
            ];
            
            // Only validate midterm_exam for 2nd semester
            if (strpos($semester, '2nd semester') !== false) {
                $validationRules['scores.*.midterm_exam'] = "nullable|numeric|min:0|max:{$midtermExamMax}";
                $validationRules['max_midterm'] = 'nullable|integer|min:1';
            }
            
            $request->validate($validationRules);
            
            $examScoreModel = $this->getExamScoreModelForSemester($semester);
            $scores = $request->input('scores');
            
            \Log::info('Using model: ' . $examScoreModel);
            
            // Use database transaction to ensure atomicity
            DB::transaction(function () use ($scores, $examScoreModel, $semester, $maxFinal, $maxMidterm) {
                foreach ($scores as $score) {
                    // Convert empty strings to null and validate numeric values
                    $finalExam = $score['final_exam'];
                    if ($finalExam === '' || $finalExam === null) {
                        $finalExam = null;
                    } else {
                        $finalExam = (int) $finalExam;
                        if ($finalExam < 0) $finalExam = 0;
                        if ($finalExam > $maxFinal) $finalExam = $maxFinal;
                    }
                    
                    $midtermExam = null;
                    if (strpos($semester, '2nd semester') !== false) {
                        // Only process midterm for 2nd semester
                        $midtermExam = $score['midterm_exam'] ?? null;
                        if ($midtermExam === '' || $midtermExam === null) {
                            $midtermExam = null;
                        } else {
                            $midtermExam = (int) $midtermExam;
                            if ($midtermExam < 0) $midtermExam = 0;
                            if ($midtermExam > $maxMidterm) $midtermExam = $maxMidterm;
                        }
                    }
                    
                    // Calculate average and subject_prof based on semester
                    $subjectProf = 0;
                    if ($semester === '2025-2026 2nd semester') {
                        // For 2nd semester: mean of normalized scores × 100
                        $finalNorm = ($finalExam === null) ? 0 : (($maxFinal > 0) ? ($finalExam / $maxFinal) : 0);
                        $midNorm = ($midtermExam === null) ? 0 : (($maxMidterm > 0) ? ($midtermExam / $maxMidterm) : 0);
                        $average = (($finalNorm + $midNorm) / 2) * 100;
                        // Format to 2 decimal places for 2nd semester
                        $average = round($average, 2);
                    } else {
                        // For 1st semester: (Final / maxFinal) * 100
                        $denominator = max(1, $maxFinal);
                        $average = ($finalExam === null) ? 0 : ($finalExam / $denominator) * 100;
                        // Format to whole number for 1st semester
                        $average = round($average);
                    }
                    // Calculate Subject Prof (40%) for both semesters (rounded to whole number, max 40)
                    $subjectProf = min(40, round($average * 0.40));

                    // Build payload based on semester - different columns for different tables
                    if (strpos($semester, '2nd semester') !== false) {
                        // 2nd semester table has both midterm_exam and final_exam
                        $payload = [
                            'final_exam' => $finalExam,
                            'midterm_exam' => $midtermExam,
                            'average' => $average,
                            'subject_prof' => $subjectProf,
                        ];
                    } else {
                        // 1st semester table only has final_exam (no midterm_exam column)
                        $payload = [
                            'final_exam' => $finalExam,
                            'average' => $average,
                            'subj_prof_40' => $subjectProf,
                        ];
                    }

                    \Log::info('Saving exam score', [
                        'user_id' => $score['id'],
                        'semester' => $semester,
                        'payload' => $payload
                    ]);

                    $examScore = $examScoreModel::updateOrCreate(
                        [
                            'user_id' => $score['id'],
                            'semester' => $semester
                        ],
                        $payload
                    );
                }
            });

            // Clear any relevant caches to ensure immediate data availability
            \Cache::forget("exams_{$semester}");
            \Cache::forget("final_grades_{$semester}");

            return response()->json(['message' => 'Successfully saved exam scores.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in saveExamScores', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error saving exam scores', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error saving exam scores: ' . $e->getMessage()], 500);
        }
    }
}
