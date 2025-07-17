<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    // Get all users (for admin/API)
    public function index()
    {
        $users = User::select('last_name', 'first_name', 'middle_name')->get();
        return response()->json($users);
    }

    // Get cadets (users with role 'user') for faculty merits
    public function getCadets()
    {
        $cadets = User::where('role', 'user')
                     ->where('status', 'approved')
                     ->orderBy('last_name')
                     ->get(['id', 'first_name', 'middle_name', 'last_name', 'platoon', 'company', 'battalion']);
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
            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'birthday' => 'nullable|string|max:255',
                'gender' => 'nullable|string|max:20',
                'age' => 'nullable|string|max:10',
                'phone_number' => 'nullable|string|max:20',
                'student_number' => 'nullable|string|max:50',
                'platoon' => 'nullable|string|max:50',
                'company' => 'nullable|string|max:50',
                'battalion' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'year_course_section' => 'nullable|string|max:255',
                'blood_type' => 'nullable|string|max:10',
                'region' => 'nullable|string|max:50',
                'height' => 'nullable|string|max:10',
                'address' => 'nullable|string|max:255',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            // Convert empty strings to null for database compatibility
            $dataToUpdate = [];
            foreach ($validated as $key => $value) {
                // Convert empty strings to null, but keep actual values
                $dataToUpdate[$key] = ($value === '' || $value === null) ? null : $value;
            }

            \Log::info('Data to update', ['data' => $dataToUpdate]);

            // Auto-set battalion based on gender
            if (isset($dataToUpdate['gender'])) {
                if ($dataToUpdate['gender'] === 'Female') {
                    $dataToUpdate['battalion'] = '2nd Battalion';
                } elseif ($dataToUpdate['gender'] === 'Male') {
                    $dataToUpdate['battalion'] = '1st Battalion';
                }
            }

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
        \Log::info('uploadAvatar called', [
            'all' => $request->all(),
            'files' => $request->files->all(),
            'hasFile' => $request->hasFile('profile_picture'),
            'file' => $request->file('profile_picture')
        ]);
        $request->validate([
            'profile_picture' => 'required|image|max:5120', // 5MB
        ]);

        $user = auth()->user();
        $file = $request->file('profile_picture');
        $path = $file->store('avatars', 'public');

        // Save the path to the user
        $user->profile_pic_url = '/storage/' . $path;
        $user->save();

        return response()->json(['success' => true, 'url' => $user->profile_pic_url]);
    }

    // Get merits for all cadets
    public function getMerits()
    {
        $merits = \App\Models\Merit::with('cadet')
            ->where('type', 'military_attitude')
            ->get()
            ->keyBy('cadet_id');
        
        return response()->json($merits);
    }

    // Save merits for cadets
    public function saveMerits(Request $request)
    {
        $request->validate([
            'merits' => 'required|array',
            'merits.*.cadet_id' => 'required|exists:users,id',
            'merits.*.days' => 'required|array|size:15',
            'merits.*.days.*' => 'nullable|integer|min:0|max:10',
            'merits.*.percentage' => 'required|integer|min:0|max:30',
        ]);

        $faculty = auth()->user();
        $savedCount = 0;

        foreach ($request->merits as $meritData) {
            $sum = array_sum($meritData['days']); // $meritData['days'] is an array of 15 day scores
            $percentage = ($sum / 150) * 30;

            $merit = \App\Models\Merit::updateOrCreate(
                [
                    'cadet_id' => $meritData['cadet_id'],
                    'type' => 'military_attitude'
                ],
                [
                    'percentage' => $percentage,
                    'updated_by' => $faculty->id
                ]
            );

            // Update day scores
            for ($i = 1; $i <= 15; $i++) {
                $merit->{"day_$i"} = $meritData['days'][$i - 1] ?? null;
            }
            
            $merit->save();
            $savedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully saved merits for {$savedCount} cadets",
            'saved_count' => $savedCount
        ]);
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
        $query = \App\Models\User::query()->where('role', 'user')->where('status', 'approved');

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
}