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
    public function getEquivalentGrades(Request $request)
    {
        $query = User::where('role', 'user')
                    ->where('archived', false)
                    ->select('id', 'equivalent_grade', 'final_grade', 'semester')
                    ->whereNotNull('equivalent_grade');
        
        // Filter by semester if provided
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        
        $users = $query->get();
        
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
            // Get users with their grade information
            $users = User::where('role', 'user')
                        ->where('archived', false)
                        ->leftJoin('user_grades', function($join) {
                            $join->on('users.id', '=', 'user_grades.user_id')
                                 ->where('user_grades.semester', '=', \DB::raw('users.semester'));
                        })
                        ->select(
                            'users.id',
                            'users.student_number',
                            'users.first_name',
                            'users.last_name',
                            'users.middle_name',
                            'users.year',
                            'users.course',
                            'users.section',
                            'users.gender',
                            'users.birthday',
                            'users.blood_type',
                            'users.address',
                            'users.region',
                            'users.height',
                            'users.phone_number',
                            'users.platoon',
                            'users.company',
                            'users.battalion',
                            'users.semester',
                            'users.campus',
                            'user_grades.final_grade',
                            'user_grades.equivalent_grade',
                            'user_grades.remarks as grade_remarks',
                            'users.remarks as user_remarks'
                        )
                        ->get();
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching grades: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get the top-performing cadet based on the highest equivalent grade
     * Note: In this system, the best grade is 1.0 (closest to 1.0 is better)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTopCadet()
    {
        try {
            // Check if equivalent_grade column exists
            $columns = \Schema::getColumnListing('users');
            $hasEquivalentGrade = in_array('equivalent_grade', $columns);
            $hasFinalGrade = in_array('final_grade', $columns);
            
            if (!$hasEquivalentGrade && !$hasFinalGrade) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Grade system not yet configured. No grade columns found in users table.'
                ]);
            }
            
            $query = User::where('role', 'user')
                        ->where('archived', false);
            
            // Select columns that exist
            $selectColumns = ['id', 'first_name', 'middle_name', 'last_name', 'year', 'course', 'section'];
            
            if ($hasEquivalentGrade) {
                $selectColumns[] = 'equivalent_grade';
                $query->whereNotNull('equivalent_grade')
                      ->orderBy('equivalent_grade'); // Order by grade ascending (1.0 is better than 5.0)
            } elseif ($hasFinalGrade) {
                $selectColumns[] = 'final_grade';
                $query->whereNotNull('final_grade')
                      ->orderBy('final_grade'); // Order by grade ascending (1.0 is better than 5.0)
            }
            
            $topCadet = $query->select($selectColumns)->first();

            if (!$topCadet) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No cadets with grades found. Grades may not be calculated yet.'
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => $topCadet
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching top cadet: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available semesters for filtering
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableSemesters()
    {
        try {
            // Get semesters from users table
            $userSemesters = User::where('role', 'user')
                            ->where('archived', false)
                            ->whereNotNull('semester')
                            ->distinct()
                            ->pluck('semester')
                            ->filter();
            
            // Get semesters from second semester tables
            $secondSemesterSemesters = collect();
            try {
                $secondSemesterSemesters = \DB::table('second_semester_aptitude')
                                            ->distinct()
                                            ->pluck('semester')
                                            ->filter();
            } catch (\Exception $e) {
                // Table might not exist, ignore
            }
            
            // Combine and sort semesters
            $allSemesters = $userSemesters->merge($secondSemesterSemesters)
                                        ->unique()
                                        ->sort()
                                        ->values();
            
            return response()->json($allSemesters);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching semesters: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get cadets filtered by semester
     * 
     * @param string $semester
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCadetsBySemester($semester = null)
    {
        try {
            // Check if this is a second semester request
            $isSecondSemester = $semester && str_contains($semester, '2nd');
            
            if ($isSecondSemester) {
                // Handle second semester data from separate tables
                $users = User::where('role', 'user')
                            ->where('archived', false)
                            ->leftJoin('user_grades', function($join) use ($semester) {
                                $join->on('users.id', '=', 'user_grades.user_id')
                                     ->where('user_grades.semester', '=', $semester);
                            })
                            ->select(
                                'users.id',
                                'users.student_number',
                                'users.first_name',
                                'users.last_name',
                                'users.middle_name',
                                'users.year',
                                'users.course',
                                'users.section',
                                'users.gender',
                                'users.campus',
                                'user_grades.final_grade',
                                'user_grades.equivalent_grade',
                                'user_grades.remarks as grade_remarks',
                                'users.remarks as user_remarks'
                            )
                            ->get()
                            ->map(function($user) use ($semester) {
                                // Add semester information
                                $user->semester = $semester;
                                
                                // Check if this user has second semester data
                                $hasSecondSemesterData = \DB::table('second_semester_aptitude')
                                                           ->where('cadet_id', $user->id)
                                                           ->where('semester', $semester)
                                                           ->exists();
                                
                                if (!$hasSecondSemesterData) {
                                    // User doesn't have second semester data, set grades to null
                                    $user->final_grade = null;
                                    $user->equivalent_grade = null;
                                    $user->grade_remarks = 'No Data';
                                }
                                
                                return $user;
                            });
            } else {
                // Handle first semester or all semesters (existing logic)
                $query = User::where('role', 'user')
                            ->where('archived', false)
                            ->leftJoin('user_grades', function($join) use ($semester) {
                                $join->on('users.id', '=', 'user_grades.user_id');
                                if ($semester) {
                                    $join->where('user_grades.semester', '=', $semester);
                                }
                            });

                if ($semester) {
                    $query->where('users.semester', $semester);
                }

                $users = $query->select(
                                'users.id',
                                'users.student_number',
                                'users.first_name',
                                'users.last_name',
                                'users.middle_name',
                                'users.year',
                                'users.course',
                                'users.section',
                                'users.gender',
                                'users.semester',
                                'users.campus',
                                'user_grades.final_grade',
                                'user_grades.equivalent_grade',
                                'user_grades.remarks as grade_remarks',
                                'users.remarks as user_remarks'
                            )
                            ->get();
            }
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching cadets: ' . $e->getMessage()], 500);
        }
    }
}
