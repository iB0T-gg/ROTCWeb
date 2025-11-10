<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        // Check if user is authenticated
        if (Auth::check()) {
            $user = Auth::user();
            
            // Log for debugging
            \Log::info('RedirectIfAuthenticated middleware triggered for user: ' . $user->id . ' with role: ' . $user->role);
            
            // Allow pending users to access login page so they can logout
            // This prevents the redirect loop when they click "Back to Login"
            if ($user->status === 'pending' && ($request->is('/') || $request->is('/login'))) {
                \Log::info('Allowing pending user to access login page');
                return $next($request);
            }
            
            // Check if user status is pending
            if ($user->status === 'pending') {
                \Log::info('Redirecting pending user to /pending');
                return redirect('/pending');
            }
            
            // Redirect based on user role
            switch ($user->role) {
                case 'admin':
                    \Log::info('Redirecting admin user to /adminHome');
                    return redirect('/adminHome');
                case 'faculty':
                    \Log::info('Redirecting faculty user to /faculty/facultyHome');
                    return redirect('/faculty/facultyHome');
                case 'platoon_leader':
                    \Log::info('Redirecting platoon leader user to /platoon-leader/attendance');
                    return redirect('/platoon-leader/attendance');
                case 'user':
                    \Log::info('Redirecting regular user to /user/userHome');
                    return redirect('/user/userHome');
                default:
                    \Log::info('Redirecting unknown role user to /pending');
                    return redirect('/pending');
            }
        }

        // User is not authenticated, allow access to auth pages
        \Log::info('User not authenticated, allowing access to auth page');
        return $next($request);
    }
}