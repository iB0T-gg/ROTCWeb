<?php
/**
 * Web Routes
 * 
 * This file contains all the web routes for the ROTC Portal application.
 * Routes are organized into middleware groups to control access based on user role:
 * 
 * - Guest middleware: Only accessible when NOT logged in (auth pages)
 * - Auth middleware: Requires user to be logged in
 * - Role-specific middleware: AdminMiddleware, UserMiddleware, FacultyMiddleware
 * 
 * All role-specific routes are protected by both 'auth' middleware (to ensure
 * the user is logged in) and the respective role middleware (to ensure the
 * user has the correct role for the requested page).
 * 
 * MIDDLEWARE SECURITY IMPLEMENTATION:
 * 1. Authentication routes (login, register, password reset) are under 'guest' middleware
 *    to ensure they're only accessible when NOT logged in.
 * 2. Admin routes are protected by AdminMiddleware to restrict access to admin users only.
 * 3. User routes are protected by UserMiddleware to restrict access to regular users only.
 * 4. Faculty routes are protected by FacultyMiddleware to restrict access to faculty only.
 * 5. API routes are protected based on the role requirements for each endpoint.
 * 
 * This ensures proper access control throughout the application, preventing users
 * from accessing pages or functionality not intended for their role.
 */

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\UserMiddleware;
use App\Http\Middleware\FacultyMiddleware;

// Authentication Routes - Accessible without login
Route::middleware('guest')->group(function () {
    // Login
    Route::get('/', function () {
        return Inertia::render('auth/Login');
    });

    Route::get('/login', function () {
        return Inertia::render('auth/Login');
    })->name('login');

    // Registration
    Route::get('/register', function () {
        return Inertia::render('auth/Register');
    });

    Route::get('/register-faculty', function () {
        return Inertia::render('auth/RegisterFaculty');
    });

    // Password Reset
    Route::get('/forgotPassword', function () {
        return Inertia::render('auth/forgotPassword');
    })->name('password.request');

    Route::get('/reset-password/{token}', function (string $token) {
        return Inertia::render('auth/resetPassword', [
            'token' => $token,
            'email' => request('email'),
        ]);
    })->name('password.reset');

    // Auth Controller Actions
    Route::post('/register', [AuthController::class, 'register'])
        ->name('register');

    Route::post('/register-faculty', [AuthController::class, 'registerFaculty'])
        ->name('register.faculty');

    Route::post('/login', [AuthController::class, 'login'])
        ->name('login');

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->name('password.email');

    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->name('password.update');
});

// Pending page - accessible to authenticated users with pending status
Route::get('/pending', function () {
    return Inertia::render('auth/pending');
})->middleware('auth')->name('pending');

// Logout - requires auth
Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Test email route (remove in production)
Route::get('/test-email', function () {
    try {
        \Illuminate\Support\Facades\Mail::raw('Test email from ROTC Webpage', function ($message) {
            $message->to('test@example.com')
                    ->subject('Test Email')
                    ->from('noreply@rotc-webpage.com', 'ROTC Webpage');
        });
        return 'Email sent successfully!';
    } catch (\Exception $e) {
        return 'Email failed: ' . $e->getMessage();
    }
});

// Test session and CSRF route (remove in production)
Route::get('/test-session', function () {
    return response()->json([
        'session_id' => session()->getId(),
        'csrf_token' => csrf_token(),
        'user' => auth()->user() ? auth()->user()->id : null,
        'timestamp' => now()->toISOString()
    ]);
})->middleware('auth');

// Test file upload route (remove in production)
Route::post('/test-upload', function (Request $request) {
    return response()->json([
        'has_file' => $request->hasFile('test_file'),
        'file_info' => $request->file('test_file') ? [
            'name' => $request->file('test_file')->getClientOriginalName(),
            'size' => $request->file('test_file')->getSize(),
            'mime' => $request->file('test_file')->getMimeType(),
        ] : null,
        'csrf_token' => csrf_token(),
        'session_id' => session()->getId(),
    ]);
})->middleware('auth');

// Refresh CSRF token route
Route::post('/refresh-csrf', function (Request $request) {
    $request->session()->regenerateToken();
    return response()->json([
        'csrf_token' => csrf_token(),
        'session_id' => session()->getId(),
    ]);
})->middleware('auth');

// Admin Routes - Only accessible to admins
Route::middleware(['auth', AdminMiddleware::class])->group(function () {
    Route::get('/adminHome', function () {
        return Inertia::render('admin/adminHome');
    });

    Route::get('/adminPermission', function () {
        return Inertia::render('admin/adminPermission');
    });

    Route::get('/adminAttendance', function () {
        return Inertia::render('admin/adminAttendance');
    });

    Route::get('/adminMasterlist', function () {
        return Inertia::render('admin/adminMasterlist');
    });
    
    Route::get('/adminMasterlist/profile', function () {
        return Inertia::render('admin/adminCadetsProfile');
    });

    Route::get('/Issue', function () {
        return Inertia::render('admin/Issue');
    });
});

// User Routes - Only accessible to users
Route::middleware(['auth', UserMiddleware::class])->group(function () {
    Route::get('/user/userHome', function () {
        return Inertia::render('user/userHome');
    });

    // Test route
    Route::get('/test', function () {
        return Inertia::render('user/test');
    });

    // Profile route
    Route::get('/user/userProfile', function () {
        return Inertia::render('user/userProfile', [
            'user' => auth()->user()
        ]);
    });
    
    Route::get('/user/userAttendance', function () {
        return Inertia::render('user/userAttendance', [
            'user' => auth()->user()
        ]);
    });

    Route::get('/user/userGrades', function () {
        return Inertia::render('user/userGrades', [
            'user' => auth()->user()
        ]);
    });

    Route::get('/user/userReportAnIssue', function () {
        return Inertia::render('user/userReportAnIssue', [
            'user' => auth()->user()
        ]);
    });
});

// Faculty routes - Only accessible to faculty
Route::middleware(['auth', FacultyMiddleware::class])->group(function () {
    Route::get('/faculty/facultyHome', function () {
        return Inertia::render('faculty/facultyHome');
    });

    Route::get('/faculty/facultyMerits', function () {
        return Inertia::render('faculty/facultyMerits');
    });

    Route::get('/faculty/facultyAttendance', function () {
        return Inertia::render('faculty/facultyAttendance');
    });

    Route::get('/faculty/facultyExams', function () {
        return Inertia::render('faculty/facultyExams');
    });

    Route::get('/faculty/facultyFinalGrades', function () {
        return Inertia::render('faculty/facultyFinalGrades');
    });

    Route::get('/faculty/facultyReportAnIssue', function () {
        return Inertia::render('faculty/facultyReportAnIssue');
    });
});

// Direct grade routes without API prefix
Route::middleware(['auth', FacultyMiddleware::class])->group(function() {
    Route::get('/direct-grades', [App\Http\Controllers\GradeController::class, 'getEquivalentGrades']);
    Route::post('/direct-grades/save', [App\Http\Controllers\GradeController::class, 'saveEquivalentGrades']);
    Route::post('/direct-grades/update', [App\Http\Controllers\GradeController::class, 'updateEquivalentGrade']);
});

// API routes - Role-specific endpoints
Route::middleware('auth')->prefix('api')->group(function () {
    // Common API endpoints for all authenticated users
    Route::post('/user/profile/update', [UserController::class, 'updateProfile']);
    Route::post('/user/profile/upload-avatar', [UserController::class, 'uploadAvatar']);
    Route::get('/filter-options', [UserController::class, 'getFilterOptions']);
    Route::get('/user/grades', [UserController::class, 'getUserGrades']);
    
    // Admin-only API endpoints
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/admin-cadets', [App\Http\Controllers\GradeController::class, 'getAdminMasterlistGrades']);
        Route::get('/top-cadet', [App\Http\Controllers\GradeController::class, 'getTopCadet']);
        
        // Attendance API endpoints for admin
        Route::get('/attendance', [AttendanceController::class, 'getAllAttendance']);
        Route::get('/attendance/{userId}', [AttendanceController::class, 'getUserAttendance']);
        Route::post('/attendance/update', [AttendanceController::class, 'updateAttendance']);
        Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
        Route::post('/approve-user', [AdminController::class, 'approveUser']);
        Route::post('/reject-user', [AdminController::class, 'rejectUser']);
    });
    
    // Faculty-only API endpoints
    Route::middleware(FacultyMiddleware::class)->group(function () {
        Route::get('/cadets', function (Request $request) {
            return \App\Models\User::where('role', 'user')->select(
                'id',
                'first_name',
                'last_name',
                'middle_name',
                'platoon',
                'company',
                'battalion',
                'role',
                'midterm_exam',
                'final_exam'
            )->get();
        });
        Route::get('/merits', [UserController::class, 'getMerits']);
        Route::post('/merits/save', [UserController::class, 'saveMerits']);
        
        // Attendance API endpoints for faculty
        Route::get('/faculty-attendance', [AttendanceController::class, 'getAllAttendance']);
        Route::get('/faculty-attendance/{userId}', [AttendanceController::class, 'getUserAttendance']);
    });
    
    // Faculty exam scores API endpoint
    Route::middleware(FacultyMiddleware::class)->post('/exams/save', function (Request $request) {
        $scores = $request->input('scores');
        foreach ($scores as $score) {
            $user = User::find($score['id']);
            if ($user) {
                $user->midterm_exam = $score['midterm_exam'];
                $user->final_exam = $score['final_exam'];
                $user->save();
            }
        }
        return response()->json(['message' => 'Successfully saved exam scores.']);
    });
    
    // Equivalent Grades API endpoints - not in API group
    Route::get('/grade-equivalents', [App\Http\Controllers\GradeController::class, 'getEquivalentGrades']);
    Route::post('/grade-equivalents/save', [App\Http\Controllers\GradeController::class, 'saveEquivalentGrades']);
    Route::post('/grade-equivalents/update', [App\Http\Controllers\GradeController::class, 'updateEquivalentGrade']);
    Route::post('/grade-equivalents/calculate', [App\Http\Controllers\GradeController::class, 'calculateAndUpdateGrades']);
});