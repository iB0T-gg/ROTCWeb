<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class PasswordController extends Controller
{
    /**
     * Change password for the authenticated user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', function ($attribute, $value, $fail) {
                if (!Hash::check($value, Auth::user()->password)) {
                    $fail('The current password is incorrect.');
                }
            }],
            'new_password' => [
                'required', 
                'min:8', 
                'different:current_password',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            ],
            'confirm_password' => ['required', 'same:new_password'],
        ], [
            'new_password.min' => 'The new password must be at least 8 characters long.',
            'new_password.regex' => 'The new password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
        ]);

        $user = Auth::user();
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Return a simple success response without JSON
        return back();
    }

    /**
     * Change password for admin users
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function adminChangePassword(Request $request)
    {
        return $this->changePassword($request);
    }

    /**
     * Change password for faculty users
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function facultyChangePassword(Request $request)
    {
        return $this->changePassword($request);
    }
}
