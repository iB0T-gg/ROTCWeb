<?php
/**
 * Authentication Controller
 * 
 * This controller handles all authentication-related functionality including:
 * - User registration (both regular users and faculty)
 * - User login and logout
 * - Password reset requests and processing
 * - Role-based redirections after login
 */

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Default redirect path after authentication
     * Note: This is overridden by authenticated() method for role-specific redirects
     */
    protected $redirectTo = '/user/userHome';

    /**
     * Get password validation rules with enhanced security requirements
     * 
     * Returns validation rules for password that require:
     * - Minimum 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter  
     * - At least one number
     * - At least one special character
     * 
     * @return array Password validation rules and custom messages
     */
    private function getPasswordValidationRules()
    {
        return [
            'rules' => [
                'required',
                'confirmed',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]).{8,}$/'
            ],
            'messages' => [
                'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
                'password.min' => 'Password must be at least 8 characters long.',
            ]
        ];
    }

    /**
     * Register a new regular user (student)
     * 
     * Validates registration data, creates a new user with 'pending' status,
     * and stores the COR (Certificate of Registration) file.
     * 
     * @param Request $request The registration form data
     * @return \Illuminate\Http\RedirectResponse Redirect to login page with success message
     */
    public function register(Request $request)
    {
        $passwordValidation = $this->getPasswordValidationRules();
        
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users',
            'student_number' => 'required|numeric|unique:users',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'campus' => 'required|string|max:255',
            'year' => 'required|string|max:10',
            'course' => 'required|string|max:10',
            'section' => 'nullable|string|max:10',
            'password' => $passwordValidation['rules'],
            'phone_number' => 'required|string|max:20',
            'cor_file' => 'required|file|mimes:pdf|max:2048',
        ], $passwordValidation['messages']);

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
            'gender' => $request->gender,
            'campus' => $request->campus,
            'year' => $request->year,
            'course' => $request->course,
            'section' => $request->section,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'cor_file_path' => $corFilePath,
            'status' => 'pending',
            'creation_method' => 'self_registered',
        ]);

        return redirect('/')->with('success', 'Registration submitted! Please wait for admin approval.');
    }

    /**
     * Register a new faculty member
     * 
     * Validates registration data, creates a new faculty user with 'pending' status,
     * and stores the credentials file.
     * 
     * @param Request $request The registration form data
     * @return \Illuminate\Http\RedirectResponse Redirect to login page with success message
     */
    public function registerFaculty(Request $request)
    {
        $passwordValidation = $this->getPasswordValidationRules();
        
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users',
            'employee_id' => 'required|string|unique:users,student_number',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'campus' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'password' => $passwordValidation['rules'],
            'phone_number' => 'required|string|max:20',
            'credentials_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ], $passwordValidation['messages']);

        $credentialsFilePath = null;
        if ($request->hasFile('credentials_file')) {
            $file = $request->file('credentials_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $credentialsFilePath = $file->storeAs('credentials_files', $fileName, 'public');
        }

        $user = User::create([
            'email' => $request->email,
            'student_number' => $request->employee_id, // Using student_number field for employee_id
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'campus' => $request->campus,
            'year_course_section' => $request->department, // Using year_course_section field for department
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'cor_file_path' => $credentialsFilePath, // Using cor_file_path field for credentials_file
            'role' => 'faculty',
            'status' => 'pending',
            'creation_method' => 'self_registered',
        ]);

        return redirect('/')->with('success', 'Faculty registration submitted! Please wait for admin approval.');
    }



    /**
     * Authenticate a user and handle login
     * 
     * Validates credentials, handles login attempts, and redirects users based on their role.
     * Different behavior based on user role:
     * - Admin users can always log in regardless of status
     * - Faculty users can always log in regardless of status
     * - Regular users must be approved (status != 'pending' or 'rejected')
     * 
     * @param Request $request The login form data
     * @return \Illuminate\Http\RedirectResponse Redirect to appropriate dashboard or back with errors
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // Check if user is archived (except for admin users)
            if ($user->archived && $user->role !== 'admin') {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Your account has been archived. Please contact the administrator.',
                ])->onlyInput('email');
            }
            
            // Admin users can always log in regardless of status
            if ($user->role === 'admin') {
                $request->session()->regenerate();
                return redirect()->intended('/adminHome');
            }
            
            // Faculty users can log in if not archived
            if ($user->role === 'faculty') {
                $request->session()->regenerate();
                return redirect()->intended('/faculty/facultyHome');
            }
            
            // For regular users, check approval status
            if (isset($user->status)) {
                if ($user->status === 'pending') {
                    Auth::logout();
                    $request->session()->regenerate();
                    return redirect()->route('pending');
                }
                
                if ($user->status === 'rejected') {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => 'Your account has been rejected. Please contact the administrator.',
                    ])->onlyInput('email');
                }
            }
            
            // User is approved, regenerate session and redirect to user home
            $request->session()->regenerate();
            return redirect()->intended('/user/userHome');
        }

        // Authentication failed
        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Handle role-based redirection after authentication
     * 
     * This method is used by Laravel's authentication system to determine
     * where to redirect users after login.
     * 
     * @param Request $request The request object
     * @param User $user The authenticated user
     * @return \Illuminate\Http\RedirectResponse Redirect to role-specific dashboard
     */
    public function authenticated(Request $request, $user)
    {
        if ($user->role === 'admin') {
            return redirect('/adminHome');
        } elseif ($user->role === 'faculty') {
            return redirect('/faculty/facultyHome');
        } else {
            return redirect('/user/userHome');
        }
    }

    /**
     * Log the user out and redirect to login page
     * 
     * This method logs out the current user, invalidates their session,
     * regenerates the CSRF token, and redirects to the login page.
     * 
     * @param Request $request The request object
     * @return \Illuminate\Http\RedirectResponse Redirect to login page
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Handle both JSON and regular requests
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Logged out successfully',
                'redirect' => '/'
            ]);
        }

        return redirect('/');
    }

    /**
     * Handle password reset request
     * 
     * This method validates the email, checks if a user exists with that email,
     * and sends a password reset link if found. The actual email sending is 
     * handled by Laravel's Password facade.
     * 
     * @param Request $request The request containing the email
     * @return \Illuminate\Http\RedirectResponse Back with status or errors
     */
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
    
    /**
     * Reset user password
     * 
     * This method handles the password reset form submission.
     * It validates the token, email, and new password, then
     * attempts to reset the password using Laravel's Password facade.
     * 
     * @param Request $request The request with token, email, and new password
     * @return \Illuminate\Http\RedirectResponse Redirect to login with success or back with errors
     */
    public function resetPassword(Request $request)
    {
        $passwordValidation = $this->getPasswordValidationRules();
        
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => $passwordValidation['rules'],
        ], $passwordValidation['messages']);

        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => \Illuminate\Support\Facades\Hash::make($password)
                ])->save();

                // Fire password reset event
                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        if ($status === \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
            // Password reset successful, redirect to login page with success message
            return redirect('/')->with('status', 'Your password has been reset successfully!');
        } else {
            // Password reset failed, return to form with errors
            return back()->withErrors(['email' => [__($status)]]);
        }
    }
}
