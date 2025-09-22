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
        $query = User::where('role', 'user');
        
        $users = $query->get();
        $examData = [];

        foreach ($users as $user) {
            // Get exam scores for this user and semester
            $examScore = $examScoreModel::where('user_id', $user->id)
                ->where('semester', $semester)
                ->first();
            
            $finalExam = $examScore ? $examScore->final_exam : '';
            $midtermExam = $examScore ? $examScore->midterm_exam : '';
            
            // Calculate average based on semester
            if ($semester === '2026-2027 2nd semester') {
                // For 2nd semester: (Total / 123) * 100
                $total = (($finalExam === '' || $finalExam === null) ? 0 : $finalExam) + (($midtermExam === '' || $midtermExam === null) ? 0 : $midtermExam);
                $average = $total > 0 ? ($total / 123) * 100 : 0;
                // Format to 2 decimal places for 2nd semester
                $average = round($average, 2);
            } else {
                // For 1st semester: Final Exam * 2
                $average = ($finalExam === '' || $finalExam === null) ? 0 : $finalExam * 2;
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
                'average' => $average,
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
            
            // Set different validation rules based on semester
            $finalExamMax = ($semester === '2025-2026 1st semester') ? 50 : 62;
            
            $request->validate([
                'scores' => 'required|array',
                'scores.*.id' => 'required|exists:users,id',
                'scores.*.final_exam' => "nullable|integer|min:0|max:{$finalExamMax}",
                'scores.*.midterm_exam' => 'nullable|integer|min:0|max:61',
                'semester' => 'required|string',
            ]);
            $examScoreModel = $this->getExamScoreModelForSemester($semester);
            $scores = $request->input('scores');
            
            // Use database transaction to ensure atomicity
            DB::transaction(function () use ($scores, $examScoreModel, $semester) {
                foreach ($scores as $score) {
                    $finalExam = $score['final_exam'];
                    $midtermExam = $score['midterm_exam'] ?? null;
                    
                    // Calculate average based on semester
                    if ($semester === '2026-2027 2nd semester') {
                        // For 2nd semester: (Total / 123) * 100
                        $total = (($finalExam === '' || $finalExam === null) ? 0 : $finalExam) + (($midtermExam === '' || $midtermExam === null) ? 0 : $midtermExam);
                        $average = $total > 0 ? ($total / 123) * 100 : 0;
                        // Format to 2 decimal places for 2nd semester
                        $average = round($average, 2);
                    } else {
                        // For 1st semester: Final Exam * 2
                        $average = ($finalExam === '' || $finalExam === null) ? 0 : $finalExam * 2;
                        // Format to whole number for 1st semester
                        $average = round($average);
                    }
                    
                    $examScore = $examScoreModel::updateOrCreate(
                        [
                            'user_id' => $score['id'],
                            'semester' => $semester
                        ],
                        [
                            'final_exam' => $finalExam,
                            'midterm_exam' => $midtermExam,
                            'average' => $average,
                        ]
                    );
                }
            });

            return response()->json(['message' => 'Successfully saved exam scores.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving exam scores: ' . $e->getMessage()], 500);
        }
    }
}
