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
            
            $examData[] = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'platoon' => $user->platoon ?? '',
                'company' => $user->company ?? '',
                'battalion' => $user->battalion ?? '',
                // Return empty string when no score so UI shows blank inputs, not 0
                'midterm_exam' => $examScore ? $examScore->midterm_exam : '',
                'final_exam' => $examScore ? $examScore->final_exam : '',
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
            $request->validate([
                'scores' => 'required|array',
                'scores.*.id' => 'required|exists:users,id',
                'scores.*.midterm_exam' => 'nullable|integer|min:0|max:50',
                'scores.*.final_exam' => 'nullable|integer|min:0|max:50',
                'semester' => 'required|string',
            ]);

            $semester = $request->input('semester');
            $examScoreModel = $this->getExamScoreModelForSemester($semester);
            $scores = $request->input('scores');
            
            // Use database transaction to ensure atomicity
            DB::transaction(function () use ($scores, $examScoreModel, $semester) {
                foreach ($scores as $score) {
                    $examScore = $examScoreModel::updateOrCreate(
                        [
                            'user_id' => $score['id'],
                            'semester' => $semester
                        ],
                        [
                            'midterm_exam' => $score['midterm_exam'],
                            'final_exam' => $score['final_exam'],
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
