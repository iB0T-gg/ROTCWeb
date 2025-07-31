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
            $updateData = ['equivalent_grade' => $equivalentGrade];
            
            // Add final grade if provided
            if ($finalGrade !== null) {
                $updateData['final_grade'] = $finalGrade;
            }
            
            User::where('id', $userId)
                ->update($updateData);
            
            return response()->json(['message' => 'Grades updated successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error updating grades: ' . $e->getMessage()], 500);
        }
    }
}
