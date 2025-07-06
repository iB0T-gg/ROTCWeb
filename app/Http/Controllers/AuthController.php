<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users',
            'student_number' => 'required|string|unique:users',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'year_course_section' => 'required|string|max:255',
            'password' => ['required', 'confirmed', 'min:6'],
            'phone_number' => 'required|string|max:20',
            'cor_file' => 'required|file|mimes:pdf|max:2048',
        ]);

        $corFilePath = null;
        if ($request->hasFile('cor_file')) {
            $file = $request->file('cor_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $corFilePath = $file->storeAs('cor_files', $fileName, 'public');
        }

        $user = User::create([
            'email' => $request->email,
            'student_number' => $request->student_number,
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'year_course_section' => $request->year_course_section,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'cor_file_path' => $corFilePath,
            'status' => 'pending',
        ]);

        return redirect('/')->with('success', 'Registration submitted! Please wait for admin approval.');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // Admin users can always log in regardless of status
            if ($user->role === 'admin') {
                $request->session()->regenerate();
                return redirect()->intended('/adminHome');
            }
            
            // For regular users, check approval status
            if (isset($user->status)) {
                if ($user->status === 'pending') {
                    Auth::logout();
                    return redirect()->route('pending');
                }
                
                if ($user->status === 'rejected') {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => 'Your account has been rejected. Please contact the administrator.',
                    ])->onlyInput('email');
                }
            }
            
            $request->session()->regenerate();
            return redirect()->intended('/user/userHome');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Check if user exists
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'We can\'t find a user with that email address.']);
        }

        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            $request->only('email')
        );

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return back()->with('status', 'We have emailed your password reset link!');
        } else {
            return back()->withErrors(['email' => __($status)]);
        }
    }
    
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => \Illuminate\Support\Facades\Hash::make($password)
                ])->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        if ($status === \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
            return redirect('/')->with('status', 'Your password has been reset successfully!');
        } else {
            return back()->withErrors(['email' => [__($status)]]);
        }
    }
}
