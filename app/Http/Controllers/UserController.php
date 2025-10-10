<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserController extends Controller
{
    // Get all users (for admin/API)
    public function index()
    {
        $users = User::select(
            'id', 
            'email', 
            'student_number', 
            'first_name', 
            'middle_name', 
            'last_name', 
            'role', 
            'status',
            'archived',
            'archived_at', 
            'created_at', 
            'updated_at'
        )->get();
        return response()->json($users);
    }

    // Get cadets (users with role 'user') for faculty merits
    public function getCadets(Request $request)
    {
        $query = User::where('role', 'user')
                     ->where('status', 'approved')
                     ->where('archived', false);
        
        // Filter by semester if provided
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        
        $cadets = $query->orderBy('last_name')
                        ->get(['id', 'first_name', 'middle_name', 'last_name', 'platoon', 'company', 'battalion', 'midterm_exam', 'final_exam', 'semester']);
        return response()->json($cadets);
    }

    // Show the profile page for the logged-in user
    public function profile()
    {
        return Inertia::render('user/userProfile', [
            'user' => auth()->user()
        ]);
    }

    // Update the logged-in user's profile
    public function updateProfile(Request $request) 
    {
        $user = auth()->user();
        
        // Debug: Log the request data
        \Log::info('Profile update request started', [
            'user_id' => $user->id,
            'request_data' => $request->all()
        ]);
        
        try {
            // Validate input
            // Blue fields (unchangeable): first_name, middle_name, last_name, student_number, email - remain nullable
            // All other fields are required when editing
            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'birthday' => 'required|string|max:255',
                'gender' => 'required|string|max:20',
                'age' => 'required|string|max:10',
                'phone_number' => 'required|string|max:20',
                'campus' => 'required|string|max:255',
                'student_number' => 'nullable|string|max:50',
                'platoon' => 'required|string|max:50',
                'company' => 'required|string|max:50',
                'battalion' => 'required|string|max:50',
                'email' => 'nullable|email|max:255',
                'year' => 'required|string|max:10',
                'course' => 'required|string|max:10',
                'section' => 'required|string|max:10',
                'blood_type' => 'required|string|max:10',
                'region' => 'required|string|max:50',
                'height' => 'required|string|max:10',
                'address' => 'required|string|max:255',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            // Convert empty strings to null for database compatibility
            $dataToUpdate = [];
            foreach ($validated as $key => $value) {
                // Convert empty strings to null, but keep actual values
                $dataToUpdate[$key] = ($value === '' || $value === null) ? null : $value;
            }

            \Log::info('Data to update', ['data' => $dataToUpdate]);



            // Update the user
            $user->update($dataToUpdate);
            
            \Log::info('Profile updated successfully', ['user_id' => $user->id]);
            
            // Return a proper Inertia response
            return back()->with('success', 'Profile updated successfully!');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            return back()->withErrors($e->errors());
            
        } catch (\Exception $e) {
            \Log::error('Profile update failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return back()->withErrors(['error' => 'Failed to update profile: ' . $e->getMessage()]);
        }
    }

    public function uploadAvatar(Request $request)
    {
        try {
            \Log::info('uploadAvatar called', [
                'all' => $request->all(),
                'files' => $request->files->all(),
                'hasFile' => $request->hasFile('profile_picture'),
                'file' => $request->file('profile_picture'),
                'session_id' => session()->getId()
            ]);

            $request->validate([
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
            ]);

            $user = auth()->user();
            
            if (!$user) {
                return back()->withErrors(['error' => 'User not authenticated']);
            }

            $file = $request->file('profile_picture');
            
            if (!$file) {
                return back()->withErrors(['error' => 'No file uploaded']);
            }

            // Generate unique filename
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            
            // Store the file
            $path = $file->storeAs('avatars', $filename, 'public');

            if (!$path) {
                return back()->withErrors(['error' => 'Failed to store file']);
            }

            // Save the path to the user
            $user->profile_pic_url = '/storage/' . $path;
            $user->save();

            \Log::info('Avatar uploaded successfully', [
                'user_id' => $user->id,
                'path' => $path,
                'url' => $user->profile_pic_url
            ]);

            return back()->with('success', 'Profile picture uploaded successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in uploadAvatar', ['errors' => $e->errors()]);
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            \Log::error('Error in uploadAvatar', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Upload failed: ' . $e->getMessage()]);
        }
    }

    // Get merits for all cadets
    public function getMerits(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $meritModel = $this->getMeritModelForSemester($semester);
        
        if (!$meritModel) {
            return response()->json(['error' => 'Invalid semester provided'], 400);
        }
        
        $query = $meritModel::with('cadet')
            ->where('type', 'military_attitude')
            ->where('semester', $semester);
        
        $merits = $query->get()->keyBy('cadet_id');
        
        return response()->json($merits);
    }

    // Save merits for cadets
    public function saveMerits(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('saveMerits called', [
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);

            // Determine week count based on semester
            $semester = $request->input('semester');
            $weekCount = strpos($semester, '1st semester') !== false ? 10 : 15;
            
            $request->validate([
                'merits' => 'required|array',
                'merits.*.cadet_id' => 'required|exists:users,id',
                'merits.*.days' => "required|array|size:$weekCount",
                'merits.*.days.*' => 'nullable|numeric|min:0|max:10',
                'merits.*.demerits' => "nullable|array|size:$weekCount",
                'merits.*.demerits.*' => 'nullable|numeric|min:0|max:10',
                'semester' => 'required|string',
            ]);

            $faculty = auth()->user();
            if (!$faculty) {
                \Log::error('No authenticated user found in saveMerits');
                return response()->json(['error' => 'Authentication required'], 401);
            }

            // Determine which model to use based on semester
            $semester = $request->input('semester');
            $meritModel = $this->getMeritModelForSemester($semester);
            
            if (!$meritModel) {
                return response()->json(['error' => 'Invalid semester provided'], 400);
            }

            // Use database transaction to ensure atomicity
            $savedCount = 0;
            \DB::transaction(function () use ($request, $meritModel, $semester, $faculty, $weekCount, &$savedCount) {
                foreach ($request->merits as $meritData) {
                try {
                    // Compute totals using merits only, per requirement
                    $meritValues = [];
                    for ($i = 0; $i < $weekCount; $i++) {
                        $meritValues[] = $meritData['days'][$i] ?? 0;
                    }
                    $sum = array_sum($meritValues); // total_merits
                    $aptitude30 = round($sum * 0.30, 2); // aptitude_30

                    $merit = $meritModel::updateOrCreate(
                        [
                            'cadet_id' => $meritData['cadet_id'],
                            'type' => 'military_attitude',
                            'semester' => $semester
                        ],
                        [
                            'total_merits' => max(0, $sum),
                            'aptitude_30' => $aptitude30,
                            'updated_by' => $faculty->id,
                            'merits_array' => $meritData['days'],
                            'semester' => $semester
                        ]
                    );

                    // Update week scores - preserve empty strings instead of converting to null
                    for ($i = 1; $i <= $weekCount; $i++) {
                        $weekValue = $meritData['days'][$i - 1] ?? '';
                        // Keep empty strings as empty strings, convert 0 to empty string for consistency
                        $merit->{"merits_week_$i"} = ($weekValue === 0 || $weekValue === '0') ? '' : $weekValue;
                    }

                    // Update demerits week scores if provided
                    if (isset($meritData['demerits'])) {
                        for ($i = 1; $i <= $weekCount; $i++) {
                            $demeritValue = $meritData['demerits'][$i - 1] ?? '';
                            // Keep empty strings as empty strings, convert 0 to empty string for consistency
                            $merit->{"demerits_week_$i"} = ($demeritValue === 0 || $demeritValue === '0') ? '' : $demeritValue;
                        }
                    }
                    // Also set merits_array and demerits_array JSON fields - convert 0s to empty strings for consistency
                    $processedDays = array_map(function($day) {
                        return ($day === 0 || $day === '0') ? '' : $day;
                    }, $meritData['days']);
                    $processedDemerits = array_map(function($demerit) {
                        return ($demerit === 0 || $demerit === '0') ? '' : $demerit;
                    }, $meritData['demerits'] ?? []);
                    
                    $merit->merits_array = $processedDays;
                    $merit->demerits_array = $processedDemerits;
                    $merit->total_merits = max(0, $sum);
                    $merit->aptitude_30 = $aptitude30;
                    $merit->save();

                    // Recompute and save equivalent grade for the user
                    $user = \App\Models\User::find($meritData['cadet_id']);
                    if ($user) {
                        // Get latest merit percentage (just saved), attendance percentage, and exam scores
                        $attendanceRecord = \DB::table('first_semester_attendance')->where('user_id', $user->id)->first();
                        $attendancePercentage = $attendanceRecord ? floatval($attendanceRecord->percentage) : 0;
                        
                        // Get exam scores from the exam scores table
                        $examScore = \App\Models\ExamScore::where('user_id', $user->id)
                            ->where('semester', $semester)
                            ->first();
                        $finalExam = $examScore ? $examScore->final_exam : null;
                        $average = $examScore ? $examScore->average : null;
                        
                        $user->equivalent_grade = $user->computeEquivalentGrade($percentage, $attendancePercentage, $finalExam, $average, $semester);
                        $user->save();
                    }
                    $savedCount++;
                } catch (\Exception $e) {
                    \Log::error('Error processing merit for cadet ' . $meritData['cadet_id'], [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            }
            });

            \Log::info('saveMerits completed successfully', ['saved_count' => $savedCount]);

            // Clear any relevant caches to ensure immediate data availability
            \Cache::forget("merits_{$semester}");
            \Cache::forget("cadets_{$semester}");
            \Cache::forget("final_grades_{$semester}");

            return response()->json([
                'success' => true,
                'message' => "Successfully saved merits for {$savedCount} cadets",
                'saved_count' => $savedCount
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in saveMerits', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in saveMerits', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }

    public function getFilterOptions()
    {
        $platoons = \App\Models\User::whereNotNull('platoon')->distinct()->pluck('platoon');
        $companies = \App\Models\User::whereNotNull('company')->distinct()->pluck('company');
        $battalions = \App\Models\User::whereNotNull('battalion')->distinct()->pluck('battalion');
        return response()->json([
            'platoons' => $platoons,
            'companies' => $companies,
            'battalions' => $battalions,
        ]);
    }

    public function filterCadets(Request $request)
    {
        $query = \App\Models\User::query()
            ->where('role', 'user')
            ->where('status', 'approved')
            ->where('archived', false);

        if ($request->filled('platoon')) {
            $query->where('platoon', $request->platoon);
        }
        if ($request->filled('company')) {
            $query->where('company', $request->company);
        }
        if ($request->filled('battalion')) {
            $query->where('battalion', $request->battalion);
        }

        $cadets = $query->orderBy('last_name')->get();
        return response()->json($cadets);
    }
    
    /**
     * Get attendance records for all cadets
     */
    public function getAttendance(Request $request)
    {
        $semester = $request->input('semester', '2025-2026 1st semester');
        $tableName = strpos($semester, '1st semester') !== false ? 'first_semester_attendance' : 'second_semester_attendance';
        
        // Get all attendance records from the database
        $attendanceRecords = \DB::table($tableName)->get();
        
        // Format as an associative array with cadet_id as keys
        $formattedAttendance = [];
        foreach ($attendanceRecords as $record) {
            $formattedAttendance[$record->user_id] = [
                'user_id' => $record->user_id,
                'present_count' => $record->present_count ?? 0,
                'percentage' => $record->percentage ?? 0,
                'merits_array' => json_decode($record->merits_array ?? '[]')
            ];
        }
        
        return response()->json($formattedAttendance);
    }
    
    /**
     * Save attendance records for cadets
     */
    public function saveAttendance(Request $request)
    {
        try {
            $attendanceRecords = $request->input('attendance');
            $semester = $request->input('semester', '2025-2026 1st semester');
            $tableName = strpos($semester, '1st semester') !== false ? 'first_semester_attendance' : 'second_semester_attendance';
            
            foreach ($attendanceRecords as $record) {
                // Check if record exists
                $exists = \DB::table($tableName)
                    ->where('user_id', $record['user_id'])
                    ->exists();
                
                $data = [
                    'present_count' => $record['present_count'],
                    'percentage' => $record['percentage'],
                    'merits_array' => json_encode($record['merits_array'] ?? []),
                    'updated_at' => now()
                ];
                
                if ($exists) {
                    // Update existing record
                    \DB::table($tableName)
                        ->where('user_id', $record['user_id'])
                        ->update($data);
                } else {
                    // Create new record
                    $data['user_id'] = $record['user_id'];
                    $data['created_at'] = now();
                    \DB::table($tableName)->insert($data);
                }

                // Recompute and save equivalent grade for the user
                $user = \App\Models\User::find($record['user_id']);
                // Get latest attendance percentage (just saved), merit percentage, and exam scores
                $attendancePercentage = isset($record['percentage']) ? floatval($record['percentage']) : 0;
                $merit = \App\Models\Merit::where('cadet_id', $user->id)->where('type', 'military_attitude')->first();
                $meritPercentage = $merit ? floatval($merit->percentage) : 0;
                
                // Get exam scores from the exam scores table
                $examScore = \App\Models\ExamScore::where('user_id', $user->id)
                    ->where('semester', '2025-2026 1st semester')
                    ->first();
                $finalExam = $examScore ? $examScore->final_exam : null;
                $average = $examScore ? $examScore->average : null;
                
                $user->equivalent_grade = $user->computeEquivalentGrade($meritPercentage, $attendancePercentage, $finalExam, $average, '2025-2026 1st semester');
                $user->save();
            }
            
            // Clear any relevant caches to ensure immediate data availability
            \Cache::forget("attendance_{$semester}");
            \Cache::forget("final_grades_{$semester}");
            
            return response()->json(['message' => 'Attendance records saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving attendance: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the current user's grades
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserGrades()
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        // Get user basic info
        $userInfo = User::where('id', $user->id)
                       ->select(
                           'id',
                           'first_name',
                           'last_name',
                           'middle_name',
                           'email',
                           'student_number',
                           'year',
                           'course',
                           'section'
                       )
                       ->first();
        
        if (!$userInfo) {
            return response()->json(['error' => 'User not found'], 404);
        }
        
        // Get posted grades for both semesters
        $firstSemesterGrades = DB::table('user_grades')
            ->where('user_id', $user->id)
            ->where('semester', '2025-2026 1st semester')
            ->first();
            
        $secondSemesterGrades = DB::table('user_grades')
            ->where('user_id', $user->id)
            ->where('semester', '2025-2026 2nd semester')
            ->first();
        
        // Prepare response with both semesters
        $response = [
            'id' => $userInfo->id,
            'first_name' => $userInfo->first_name,
            'last_name' => $userInfo->last_name,
            'middle_name' => $userInfo->middle_name,
            'email' => $userInfo->email,
            'student_number' => $userInfo->student_number,
            'year' => $userInfo->year,
            'course' => $userInfo->course,
            'section' => $userInfo->section,
            'first_semester' => [
                'equivalent_grade' => $firstSemesterGrades ? $firstSemesterGrades->equivalent_grade : null,
                'remarks' => $firstSemesterGrades ? $firstSemesterGrades->remarks : null,
                'final_grade' => $firstSemesterGrades ? $firstSemesterGrades->final_grade : null
            ],
            'second_semester' => [
                'equivalent_grade' => $secondSemesterGrades ? $secondSemesterGrades->equivalent_grade : null,
                'remarks' => $secondSemesterGrades ? $secondSemesterGrades->remarks : null,
                'final_grade' => $secondSemesterGrades ? $secondSemesterGrades->final_grade : null
            ]
        ];
        
        return response()->json($response);
    }

    /**
     * Get the current user's detailed ROTC grade breakdown
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserRotcGradeBreakdown(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $semester = $request->input('semester', '2025-2026 1st semester');
        
        try {
            // Use the ROTC grade controller to get detailed breakdown
            $rotcController = new \App\Http\Controllers\RotcGradeController();
            $gradeData = $rotcController->getCadetGradeBreakdown($user->id, $request);
            
            return $gradeData;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching grade breakdown: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the appropriate merit model based on semester
     */
    private function getMeritModelForSemester($semester)
    {
        if (strpos($semester, '1st semester') !== false) {
            return \App\Models\Merit::class;
        } elseif (strpos($semester, '2nd semester') !== false) {
            return \App\Models\SecondSemesterMerit::class;
        }
        
        return null;
    }

    // Get first semester merits
    public function getFirstSemesterMerits(Request $request)
    {
        $meritModel = \App\Models\Merit::class;
        
        $query = $meritModel::with('cadet')
            ->where('type', 'military_attitude')
            ->where('semester', '2025-2026 1st semester');
        
        $merits = $query->get()->keyBy('cadet_id');
        
        return response()->json($merits);
    }

    // Save first semester merits
    public function saveFirstSemesterMerits(Request $request)
    {
        try {
            \Log::info('saveFirstSemesterMerits called', [
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);

            // Debug: Log first cadet's weeks 11-15 data specifically
            if ($request->has('merits') && count($request->merits) > 0) {
                $firstMerit = $request->merits[0];
                \Log::info('DEBUG: First cadet weeks 11-15 data received', [
                    'cadet_id' => $firstMerit['cadet_id'] ?? 'MISSING',
                    'days_length' => count($firstMerit['days'] ?? []),
                    'demerits_length' => count($firstMerit['demerits'] ?? []),
                    'has_demerits_key' => isset($firstMerit['demerits']),
                    'weeks_11_15_days' => array_slice($firstMerit['days'] ?? [], 10, 5),
                    'weeks_11_15_demerits' => array_slice($firstMerit['demerits'] ?? [], 10, 5),
                    'demerits_type' => gettype($firstMerit['demerits'] ?? null)
                ]);
            }

            $request->validate([
                'merits' => 'required|array',
                'merits.*.cadet_id' => 'required|exists:users,id',
                // Accept any array length from the UI; we will slice to 10 for first semester
                'merits.*.days' => 'required|array',
                'merits.*.days.*' => 'nullable|numeric|min:0|max:10',
                'merits.*.demerits' => 'nullable|array',
                'merits.*.demerits.*' => 'nullable|numeric|min:0|max:10',
            ]);

            $faculty = auth()->user();
            if (!$faculty) {
                \Log::error('No authenticated user found in saveFirstSemesterMerits');
                return response()->json(['error' => 'Authentication required'], 401);
            }

            $meritModel = \App\Models\Merit::class;
            $semester = '2025-2026 1st semester';
            $savedCount = 0;

            \DB::transaction(function () use ($request, $meritModel, $semester, $faculty, &$savedCount) {
                foreach ($request->merits as $meritData) {
                    try {
                        // Enforce 10 weeks for first semester
                        $weekCount = 10;
                        // Normalize incoming arrays: slice or pad to 10
                        $incomingDays = is_array($meritData['days'] ?? null) ? $meritData['days'] : [];
                        $days = array_slice($incomingDays, 0, $weekCount);
                        if (count($days) < $weekCount) {
                            $days = array_merge($days, array_fill(0, $weekCount - count($days), 10));
                        }
                        $meritValues = array_map(function($v){ return (int)($v === '' || $v === null ? 0 : $v); }, $days);
                        $sum = array_sum($meritValues); // total_merits (max 100)
                        $aptitude30 = min(30, max(0, round(($sum / 100) * 30)));

                        $merit = $meritModel::updateOrCreate(
                            [
                                'cadet_id' => $meritData['cadet_id'],
                                'type' => 'military_attitude',
                                'semester' => $semester
                            ],
                            [
                                'merits_array' => $meritValues,
                                'total_merits' => max(0, $sum),
                                'aptitude_30' => $aptitude30,
                                'updated_by' => $faculty->id,
                                'updated_at' => now()
                            ]
                        );

                        // Debug: Log the first cadet's processing details
                        if ($savedCount === 0) {
                            \Log::info('DEBUG: Processing first cadet in save loop', [
                                'cadet_id' => $meritData['cadet_id'],
                                'merit_record_id' => $merit->id,
                                'weekCount' => $weekCount,
                                'has_demerits_in_request' => isset($meritData['demerits']),
                                'demerits_array_content' => $meritData['demerits'] ?? null
                            ]);
                        }

                        // Update week scores - preserve legitimate 0 values
                        for ($i = 1; $i <= $weekCount; $i++) {
                            $weekValue = $meritValues[$i - 1] ?? '';
                            // Only convert empty strings and null to empty, preserve 0 as legitimate value
                            if ($weekValue === '' || $weekValue === null) {
                                $merit->{"merits_week_$i"} = '';
                            } else {
                                $merit->{"merits_week_$i"} = $weekValue;
                            }
                        }

                        // Update demerits week scores if provided
                        if (isset($meritData['demerits'])) {
                            // Debug: Log weeks 11-15 demerit processing for first cadet
                            if ($savedCount === 0) {
                                \Log::info('DEBUG: Processing demerits for first cadet', [
                                    'cadet_id' => $meritData['cadet_id'],
                                    'demerits_array_length' => count($meritData['demerits'])
                                ]);
                            }
                            
                            // Normalize demerits to 10 (pad with 0s) so demerits_array shows numeric zeros
                            $incomingDems = is_array($meritData['demerits']) ? $meritData['demerits'] : [];
                            $demerits10 = array_slice($incomingDems, 0, $weekCount);
                            if (count($demerits10) < $weekCount) {
                                $demerits10 = array_merge($demerits10, array_fill(0, $weekCount - count($demerits10), 0));
                            }

                            for ($i = 1; $i <= $weekCount; $i++) {
                                $demeritValue = $demerits10[$i - 1] ?? '';
                                // Only convert empty strings and null to empty, preserve 0 as legitimate value
                                if ($demeritValue === '' || $demeritValue === null) {
                                    $merit->{"demerits_week_$i"} = '';
                                } else {
                                    $merit->{"demerits_week_$i"} = $demeritValue;
                                }
                            }
                            
                            // Save demerits array (10) - preserve 0 values as 0
                            $processedDemerits = array_map(function($demerit) {
                                return ($demerit === '' || $demerit === null) ? 0 : (int)$demerit;
                            }, $demerits10);
                            
                            // Debug: Log demerits array processing for first cadet
                            if ($savedCount === 0) {
                                \Log::info('DEBUG: Demerits array processing for first cadet', [
                                'full_processed_array_length' => count($processedDemerits)
                                ]);
                            }
                            
                            $merit->demerits_array = $processedDemerits;
                        }

                        $merit->total_merits = max(0, $sum);
                        $merit->aptitude_30 = $aptitude30;
                        
                        // Debug: Log final values before save for first cadet
                        if ($savedCount === 0) {
                            \Log::info('DEBUG: Final values before save for first cadet', [
                                'cadet_id' => $meritData['cadet_id'],
                                'final_demerits_weeks_11_15_columns' => [
                                    'demerits_week_11' => $merit->demerits_week_11,
                                    'demerits_week_12' => $merit->demerits_week_12,
                                    'demerits_week_13' => $merit->demerits_week_13,
                                    'demerits_week_14' => $merit->demerits_week_14,
                                    'demerits_week_15' => $merit->demerits_week_15
                                ],
                                'final_demerits_array' => $merit->demerits_array
                            ]);
                        }
                        
                        $merit->save();
                        $savedCount++;
                    } catch (\Exception $e) {
                        \Log::error('Error saving merit for cadet ' . $meritData['cadet_id'], [
                            'error' => $e->getMessage(),
                            'merit_data' => $meritData
                        ]);
                        throw $e;
                    }
                }
            });

            \Log::info('saveFirstSemesterMerits completed successfully', ['saved_count' => $savedCount]);

            return response()->json([
                'success' => true,
                'message' => "Successfully saved first semester merits for {$savedCount} cadets",
                'saved_count' => $savedCount
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in saveFirstSemesterMerits', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in saveFirstSemesterMerits', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }

    // Get second semester merits
    public function getSecondSemesterMerits(Request $request)
    {
        $meritModel = \App\Models\SecondSemesterMerit::class;
        
        $query = $meritModel::with('cadet')
            ->where('type', 'military_attitude')
            ->where('semester', '2026-2027 2nd semester');
        
        $merits = $query->get()->keyBy('cadet_id');
        
        return response()->json($merits);
    }

    // Save second semester merits
    public function saveSecondSemesterMerits(Request $request)
    {
        try {
            \Log::info('saveSecondSemesterMerits called', [
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);

            $request->validate([
                'merits' => 'required|array',
                'merits.*.cadet_id' => 'required|exists:users,id',
                'merits.*.days' => 'required|array|size:15',
                'merits.*.days.*' => 'nullable|numeric|min:0|max:10',
                'merits.*.demerits' => 'nullable|array|size:15',
                'merits.*.demerits.*' => 'nullable|numeric|min:0|max:10',
            ]);

            $faculty = auth()->user();
            if (!$faculty) {
                \Log::error('No authenticated user found in saveSecondSemesterMerits');
                return response()->json(['error' => 'Authentication required'], 401);
            }

            $meritModel = \App\Models\SecondSemesterMerit::class;
            $semester = '2026-2027 2nd semester';
            $savedCount = 0;

            \DB::transaction(function () use ($request, $meritModel, $semester, $faculty, &$savedCount) {
                foreach ($request->merits as $meritData) {
                    try {
                        // Use 15 weeks for the second semester
                        $weekCount = 15;
                        // Normalize demerits to exactly 15 and sum (treat missing as 0)
                        $incomingDemerits = is_array($meritData['demerits'] ?? null) ? $meritData['demerits'] : [];
                        $normDemerits = array_slice($incomingDemerits, 0, $weekCount);
                        if (count($normDemerits) < $weekCount) {
                            $normDemerits = array_merge($normDemerits, array_fill(0, $weekCount - count($normDemerits), ''));
                        }
                        $demeritValues = [];
                        for ($i = 0; $i < $weekCount; $i++) {
                            $val = $normDemerits[$i] ?? '';
                            $demeritValues[] = ($val === '' || $val === null) ? 0.0 : (float)$val;
                        }
                        $sumDemerits = array_sum($demeritValues);

                        // Total merits = 150 - sum(demerits)
                        $maxPossible = $weekCount * 10; // 150
                        $totalMerits = max(0, $maxPossible - $sumDemerits);
                        // Aptitude: clamp to 30 when total >= 100 else total * 0.30
                        $aptitude30 = ($totalMerits >= 100) ? 30.0 : round($totalMerits * 0.30, 2);

                        $merit = $meritModel::updateOrCreate(
                            [
                                'cadet_id' => $meritData['cadet_id'],
                                'type' => 'military_attitude',
                                'semester' => $semester
                            ],
                            [
                                // keep the merits days sent by UI (already derived), but demerits drive totals
                                'merits_array' => $meritData['days'] ?? array_fill(0, $weekCount, 10),
                                'total_merits' => $totalMerits,
                                'aptitude_30' => $aptitude30,
                                'faculty_id' => $faculty->id,
                                'updated_at' => now()
                            ]
                        );

                        // Update week scores - preserve empty strings instead of converting to null
                        for ($i = 1; $i <= $weekCount; $i++) {
                            $weekValue = $meritData['days'][$i - 1] ?? '';
                            $merit->{"merits_week_$i"} = ($weekValue === 0 || $weekValue === '0') ? '' : $weekValue;
                        }

                        // Update demerits week scores and array from normalized input
                        for ($i = 1; $i <= $weekCount; $i++) {
                            $demeritValue = $normDemerits[$i - 1] ?? '';
                            // Only store empty string for truly empty inputs; keep 0 as 0
                            $merit->{"demerits_week_$i"} = ($demeritValue === '' || $demeritValue === null) ? '' : $demeritValue;
                        }

                        $processedDemerits = array_map(function($demerit) {
                            return ($demerit === '' || $demerit === null) ? 0 : (int)$demerit;
                        }, $normDemerits);
                        $merit->demerits_array = $processedDemerits;

                        $merit->total_merits = $totalMerits;
                        $merit->aptitude_30 = $aptitude30;
                        $merit->save();
                        $savedCount++;
                    } catch (\Exception $e) {
                        \Log::error('Error saving merit for cadet ' . $meritData['cadet_id'], [
                            'error' => $e->getMessage(),
                            'merit_data' => $meritData
                        ]);
                        throw $e;
                    }
                }
            });

            \Log::info('saveSecondSemesterMerits completed successfully', ['saved_count' => $savedCount]);

            // Clear any relevant caches to ensure immediate data availability
            \Cache::forget("merits_{$semester}");
            \Cache::forget("cadets_{$semester}");
            \Cache::forget("final_grades_{$semester}");

            return response()->json([
                'success' => true,
                'message' => "Successfully saved second semester merits for {$savedCount} cadets",
                'saved_count' => $savedCount
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in saveSecondSemesterMerits', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in saveSecondSemesterMerits', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }
}