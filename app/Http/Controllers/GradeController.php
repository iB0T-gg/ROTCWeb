<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    /**
     * Get all equivalent grades for users
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEquivalentGrades()
    {
        $users = User::where('role', 'user')
                    ->select('id', 'equivalent_grade', 'final_grade')
                    ->whereNotNull('equivalent_grade')
                    ->get();
        
        return response()->json($users);
    }

    /**
     * Save equivalent grades for users
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function saveEquivalentGrades(Request $request)
    {
        $grades = $request->input('grades');
        
        if (!$grades || !is_array($grades)) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        try {
            DB::beginTransaction();
            
            foreach ($grades as $grade) {
                if (isset($grade['user_id']) && isset($grade['equivalent_grade'])) {
                    $updateData = ['equivalent_grade' => $grade['equivalent_grade']];
                    
                    // Add final grade if provided
                    if (isset($grade['final_grade'])) {
                        $updateData['final_grade'] = $grade['final_grade'];
                    }
                    
                    User::where('id', $grade['user_id'])->update($updateData);
                }
            }
            
            DB::commit();
            return response()->json(['message' => 'Grades saved successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error saving grades: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update equivalent grade for a single user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateEquivalentGrade(Request $request)
    {
        $userId = $request->input('user_id');
        $equivalentGrade = $request->input('equivalent_grade');
        $finalGrade = $request->input('final_grade');
        
        if (!$userId || !$equivalentGrade) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $updateData = ['equivalent_grade' => $equivalentGrade];
            
            // Add final grade if provided
            if ($finalGrade !== null) {
                $updateData['final_grade'] = $finalGrade;
            }
            
            // Calculate remarks based on equivalent grade
            $updateData['remarks'] = $user->getRemarks($equivalentGrade);
            
            $user->update($updateData);
            
            return response()->json(['message' => 'Grades updated successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error updating grades: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate and update all grades for a user based on merits, attendance, and exams
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateAndUpdateGrades(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'merit_percentage' => 'required|numeric|min:0|max:100',
            'attendance_percentage' => 'required|numeric|min:0|max:100',
            'midterm_exam' => 'nullable|numeric|min:0|max:100',
            'final_exam' => 'nullable|numeric|min:0|max:100'
        ]);

        try {
            $user = User::findOrFail($request->user_id);
            
            $success = $user->updateGrades(
                $request->merit_percentage,
                $request->attendance_percentage,
                $request->midterm_exam,
                $request->final_exam
            );
            
            if ($success) {
                return response()->json([
                    'message' => 'Grades calculated and updated successfully',
                    'user' => [
                        'final_grade' => $user->final_grade,
                        'equivalent_grade' => $user->equivalent_grade,
                        'remarks' => $user->remarks
                    ]
                ], 200);
            } else {
                return response()->json(['message' => 'Failed to update grades'], 500);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error calculating grades: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get complete grade information for admin masterlist
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAdminMasterlistGrades()
    {
        try {
            $users = User::where('role', 'user')
                        ->select(
                            'id',
                            'student_number',
                            'first_name',
                            'last_name',
                            'middle_name',
                            'year',
                            'course',
                            'section',
                            'gender',
                            'midterm_exam',
                            'final_exam',
                            'equivalent_grade',
                            'final_grade',
                            'remarks',
                            'platoon',
                            'company',
                            'battalion'
                        )
                        ->get();
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching grades: ' . $e->getMessage()], 500);
        }
    }
}
