<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\UserApprovalNotification;
use App\Notifications\LoginCredentialsNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Add a new user (admin function)
     */
    public function addUser(Request $request)
    {
        // Define validation rules
        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:user,faculty,platoon_leader,admin',
            'password' => 'required|string|min:6|confirmed',
        ];

        // Add student number validation only for users (cadets)
        if ($request->role === 'user') {
            $rules['student_number'] = 'required|numeric|unique:users,student_number';
        } else {
            $rules['student_number'] = 'nullable|numeric|unique:users,student_number';
        }

        // Add company and battalion validation for faculty
        if ($request->role === 'faculty') {
            $rules['company'] = 'required|string|in:alpha,bravo,charlie,delta';
            $rules['battalion'] = 'required|string|in:1st,2nd';
            
            // Add unique constraint for faculty company and battalion combination
            $rules['company'] .= '|unique:users,company,NULL,id,role,faculty,battalion,' . $request->battalion . ' Battalion';
        } elseif ($request->role === 'platoon_leader') {
            // Add company, battalion and platoon validation for platoon leader
            $rules['company'] = 'required|string|in:alpha,bravo,charlie,delta';
            $rules['battalion'] = 'required|string|in:1st,2nd';
            $rules['platoon'] = 'required|string|in:1st,2nd,3rd';
        } else {
            $rules['company'] = 'nullable|string';
            $rules['battalion'] = 'nullable|string';
            $rules['platoon'] = 'nullable|string';
        }

        $validator = Validator::make($request->all(), $rules, [
            'company.unique' => 'A faculty member is already assigned to this company and battalion combination.',
        ]);

        // Custom validation for platoon leader: check for duplicate company/battalion/platoon combination
        // Exclude archived users to allow replacement of archived platoon leaders
        // Also exclude rejected users to allow re-creation after rejection
        $validator->after(function ($validator) use ($request) {
            if ($request->role === 'platoon_leader') {
                $platoonValue = $request->platoon . ' Platoon';
                $companyValue = ucfirst($request->company);
                $battalionValue = $request->battalion ? ($request->battalion . ' Battalion') : null;
                
                // Check for existing non-archived platoon leader with same company/platoon
                // This includes both pending and approved users to prevent duplicates
                $existingPlatoonLeader = User::where('role', 'platoon_leader')
                    ->where('company', $companyValue)
                    ->where('platoon', $platoonValue)
                    ->when($battalionValue, function ($q) use ($battalionValue) {
                        $q->where('battalion', $battalionValue);
                    })
                    ->where(function($query) {
                        $query->where('archived', false)
                              ->orWhereNull('archived');
                    })
                    ->where('status', '!=', 'rejected') // Exclude rejected users
                    ->first();
                
                if ($existingPlatoonLeader) {
                    // Add error to both fields for better UX
                    $validator->errors()->add('company', 'A platoon leader is already assigned to this Company/Battalion/Platoon combination.');
                    $validator->errors()->add('platoon', 'A platoon leader is already assigned to this Company/Battalion/Platoon combination.');
                    if ($battalionValue) {
                        $validator->errors()->add('battalion', 'A platoon leader is already assigned to this Company/Battalion/Platoon combination.');
                    }
                }
            }
        });

        if ($validator->fails()) {
            // Check if the error is specifically about platoon leader duplication
            $errors = $validator->errors();
            $isDuplicateError = $errors->has('company') && 
                                ($errors->first('company') === 'A platoon leader is already assigned to this company and platoon combination.' ||
                                 $errors->first('platoon') === 'A platoon leader is already assigned to this company and platoon combination.');
            
            $errorMessage = $isDuplicateError 
                ? 'A platoon leader is already assigned to this company and platoon combination. Please choose a different company or platoon.'
                : 'Validation failed';
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => $errors
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            // Create the user with pending status (except for admin role)
            $userData = [
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'student_number' => $request->student_number,
                'role' => $request->role,
                'password' => Hash::make($request->password),
                'temp_password' => Crypt::encryptString($request->password), // Store encrypted temp password
                'status' => $request->role === 'admin' ? 'approved' : 'pending', // Admins are auto-approved
                'creation_method' => 'admin_created',
            ];

            // Add company and battalion for faculty users
            if ($request->role === 'faculty') {
                $userData['company'] = ucfirst($request->company); // Convert to proper case (Alpha, Bravo, etc.)
                $userData['battalion'] = $request->battalion . ' Battalion'; // Add "Battalion" suffix
            }
            
            // Add company, battalion and platoon for platoon leader users
            if ($request->role === 'platoon_leader') {
                $userData['company'] = ucfirst($request->company); // Convert to proper case (Alpha, Bravo, etc.)
                if ($request->battalion) {
                    $userData['battalion'] = $request->battalion . ' Battalion';
                }
                $userData['platoon'] = $request->platoon . ' Platoon'; // Add "Platoon" suffix
            }

            $user = User::create($userData);

            // If admin, send credentials immediately
            if ($request->role === 'admin') {
                try {
                    $user->notify(new LoginCredentialsNotification($user, $request->password));
                } catch (\Exception $e) {
                    \Log::error('Failed to send login credentials email: ' . $e->getMessage());
                }
            }

            $message = $request->role === 'admin' 
                ? 'Admin user created and approved successfully! Login credentials sent via email.' 
                : 'User created successfully and is pending approval!';

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'user' => $user
                ]);
            }

            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create user: ' . $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', 'Failed to create user: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Get pending users for approval
     */
    public function getPendingUsers()
    {
        $pendingUsers = User::where('status', 'pending')
                           ->whereIn('role', ['user', 'faculty', 'platoon_leader'])  // Include users, faculty, and platoon leaders
                           ->orderBy('created_at', 'desc')
                           ->get();
        
        return response()->json($pendingUsers);
    }

    /**
     * Approve a user
     */
    public function approveUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow approving pending regular users, faculty, or platoon leaders
        if (!in_array($user->role, ['user', 'faculty', 'platoon_leader'])) {
            return response()->json(['error' => 'Only regular users, faculty, and platoon leaders can be approved'], 400);
        }
        
        if ($user->status !== 'pending') {
            return response()->json(['error' => 'User is not pending approval'], 400);
        }

        $user->update(['status' => 'approved']);

        // After approval, assign platoon/company/battalion deterministically
        try {
            if ($user->role === 'user') {
                // Get all approved cadets sorted alphabetically
                $cadets = User::where('role', 'user')
                    ->where('status', 'approved')
                    ->orderBy('last_name')
                    ->orderBy('first_name')
                    ->get();

                // Find index of this user
                $index = $cadets->search(function ($c) use ($user) {
                    return $c->id === $user->id;
                });

                if ($index !== false) {
                    // Groups of 37
                    $groupIndex = intdiv($index, 37);

                    // Platoon cycles every three groups: 1st, 2nd, 3rd, then repeat
                    $cycle = $groupIndex % 3;
                    $platoon = $cycle === 0 ? '1st Platoon' : ($cycle === 1 ? '2nd Platoon' : '3rd Platoon');

                    // Company advances only after a full 3-platoon cycle (i.e., per 3 groups)
                    $companies = ['Alpha','Beta','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'];
                    $companyIndex = intdiv($groupIndex, 3);
                    $company = $companies[$companyIndex % count($companies)];

                    // Battalion by gender (case-insensitive; supports 'M'/'F')
                    $g = is_string($user->gender) ? strtolower(trim($user->gender)) : '';
                    $battalion = $g === 'male' || $g === 'm' ? '1st Battalion' : ($g === 'female' || $g === 'f' ? '2nd Battalion' : null);

                    $updates = [
                        'platoon' => $platoon,
                        'company' => $company,
                    ];
                    if ($battalion !== null) {
                        $updates['battalion'] = $battalion;
                    }

                    $user->update($updates);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed assigning platoon/company/battalion: ' . $e->getMessage());
            // Do not block approval on assignment failure
        }

        // Send different emails based on creation method
        try {
            if ($user->creation_method === 'admin_created') {
                // For admin-created users, send login credentials
                if ($user->temp_password) {
                    $plainPassword = Crypt::decryptString($user->temp_password);
                    $user->notify(new LoginCredentialsNotification($user, $plainPassword));
                    
                    // Clear the temp password after sending
                    $user->update(['temp_password' => null]);
                } else {
                    // Fallback: send regular approval notification if no temp password found
                    $user->notify(new UserApprovalNotification('approved', $user));
                }
            } else {
                // For self-registered users, send approval notification (no credentials)
                $user->notify(new UserApprovalNotification('approved', $user));
            }
        } catch (\Exception $e) {
            // Log the error but don't fail the approval
            \Log::error('Failed to send approval/credentials email: ' . $e->getMessage());
        }

        $message = $user->creation_method === 'admin_created' 
            ? 'User approved successfully and login credentials sent!'
            : 'User approved successfully and approval notification sent!';

        return response()->json(['message' => $message, 'user' => $user]);
    }

    /**
     * Reject a user
     */
    public function rejectUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow rejecting pending regular users, faculty, or platoon leaders
        if (!in_array($user->role, ['user', 'faculty', 'platoon_leader'])) {
            return response()->json(['error' => 'Only regular users, faculty, and platoon leaders can be rejected'], 400);
        }
        
        if ($user->status !== 'pending') {
            return response()->json(['error' => 'User is not pending approval'], 400);
        }

        // Send rejection notification email before deleting
        try {
            $user->notify(new UserApprovalNotification('rejected', $user));
        } catch (\Exception $e) {
            // Log the error but don't fail the rejection
            \Log::error('Failed to send rejection email: ' . $e->getMessage());
        }

        // Delete the user to free up email and student_number for re-registration
        $user->delete();

        return response()->json(['message' => 'User rejected and removed successfully. They can now re-register with the same email and student number.']);
    }
    
    /**
     * Archive a user
     */
    public function archiveUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow archiving non-admin users
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Admin users cannot be archived'], 400);
        }
        
        // Archive the user
        $user->update([
            'archived' => true,
            'archived_at' => Carbon::now()
        ]);

        return response()->json(['message' => 'User archived successfully', 'user' => $user]);
    }
    
    /**
     * Restore an archived user
     */
    public function restoreUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only restore if the user is actually archived
        if (!$user->archived) {
            return response()->json(['error' => 'User is not archived'], 400);
        }
        
        // Restore the user
        $user->update([
            'archived' => false,
            'archived_at' => null,
            'status' => 'approved' // Ensure they are approved when restored
        ]);

        return response()->json(['message' => 'User restored successfully', 'user' => $user]);
    }
    
    /**
     * Get all archived users
     */
    public function getArchivedUsers()
    {
        $archivedUsers = User::where('archived', true)
                            ->orderBy('archived_at', 'desc')
                            ->get();
        
        return response()->json($archivedUsers);
    }

    /**
     * Restore all archived users
     */
    public function restoreAllUsers(Request $request)
    {
        // Get all archived users (admins should not be archived by design)
        $archivedUsers = User::where('archived', true)->get();

        if ($archivedUsers->isEmpty()) {
            return response()->json([
                'message' => 'No archived users to restore',
                'restored_count' => 0
            ]);
        }

        $restoredCount = 0;
        foreach ($archivedUsers as $user) {
            // Restore each user and ensure status is approved
            $user->update([
                'archived' => false,
                'archived_at' => null,
                'status' => $user->status === 'approved' ? 'approved' : 'approved'
            ]);
            $restoredCount++;
        }

        return response()->json([
            'message' => 'All archived users restored successfully',
            'restored_count' => $restoredCount
        ]);
    }

    /**
     * Get duplicate platoon leaders (same company/platoon combination)
     */
    public function getDuplicatePlatoonLeaders()
    {
        // Find all non-archived, non-rejected platoon leaders
        $platoonLeaders = User::where('role', 'platoon_leader')
            ->where(function($query) {
                $query->where('archived', false)
                      ->orWhereNull('archived');
            })
            ->where('status', '!=', 'rejected')
            ->whereNotNull('company')
            ->whereNotNull('platoon')
            ->get();

        // Group by company and platoon to find duplicates
        $grouped = $platoonLeaders->groupBy(function($user) {
            return $user->company . '|' . $user->platoon;
        });

        $duplicates = [];
        foreach ($grouped as $key => $users) {
            if ($users->count() > 1) {
                $duplicates[] = [
                    'company' => $users->first()->company,
                    'platoon' => $users->first()->platoon,
                    'users' => $users->map(function($user) {
                        return [
                            'id' => $user->id,
                            'email' => $user->email,
                            'name' => $user->first_name . ' ' . $user->last_name,
                            'status' => $user->status,
                            'created_at' => $user->created_at,
                        ];
                    })->values()
                ];
            }
        }

        return response()->json([
            'duplicates' => $duplicates,
            'count' => count($duplicates)
        ]);
    }
} 