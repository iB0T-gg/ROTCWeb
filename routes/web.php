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

// Pending page - accessible to users with pending status (doesn't require auth)
Route::get('/pending', function () {
    // If user is logged in and not pending, redirect to appropriate home page
    if (auth()->check() && auth()->user()->status !== 'pending') {
        if (auth()->user()->role === 'admin') {
            return redirect('/adminHome');
        } elseif (auth()->user()->role === 'faculty') {
            return redirect('/faculty/facultyHome');
        } else {
            return redirect('/user/userHome');
        }
    }
    return Inertia::render('auth/pending');
})->name('pending');

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

// CSRF token refresh endpoint
Route::get('/csrf-token', function (Request $request) {
    return response()->json([
        'csrf_token' => csrf_token(),
        'session_id' => session()->getId(),
    ]);
});

// File serving route for storage files
Route::get('/storage/{path}', function ($path) {
    $filePath = public_path('storage/' . $path);
    
    if (!file_exists($filePath)) {
        abort(404);
    }
    
    return response()->file($filePath);
})->where('path', '.*');

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

    Route::get('/admin/add-users', function () {
        return Inertia::render('admin/adminAddUsers', [
            'success' => session('success'),
            'error' => session('error')
        ]);
    });

    Route::get('/admin/user-list', function () {
        return Inertia::render('admin/adminUserList');
    });

    Route::get('/admin/change-password', function () {
        return Inertia::render('admin/adminChangePassword');
    });

    Route::get('/Issue', [App\Http\Controllers\IssueController::class, 'index']);
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

    Route::get('/user/userReportAnIssue', [App\Http\Controllers\IssueController::class, 'userReportForm']);
    
    Route::get('/user/change-password', function () {
        return Inertia::render('user/userChangePassword');
    });
});

// Faculty routes - Only accessible to faculty
Route::middleware(['auth', FacultyMiddleware::class])->group(function () {
    Route::get('/faculty/facultyHome', function () {
        return Inertia::render('faculty/facultyHome');
    });

    Route::get('/faculty/facultyMerits', function () {
        return Inertia::render('faculty/facultyMerits', [
            'auth' => auth()->user()
        ]);
    });

    Route::get('/faculty/facultyAttendance', function () {
        return Inertia::render('faculty/facultyAttendance', [
            'auth' => auth()->user()
        ]);
    });

    Route::get('/faculty/facultyExams', function () {
        return Inertia::render('faculty/facultyExams', [
            'auth' => auth()->user()
        ]);
    });

    Route::get('/faculty/facultyFinalGrades', function () {
        return Inertia::render('faculty/facultyFinalGrades', [
            'auth' => auth()->user()
        ]);
    });

    // Debug route to check faculty filtering
    Route::get('/faculty/debug', function () {
        $user = auth()->user();
        $debug = [
            'user_id' => $user->id,
            'name' => $user->first_name . ' ' . $user->last_name,
            'role' => $user->role,
            'company' => $user->company,
            'battalion' => $user->battalion,
            'should_filter' => $user->role === 'faculty' && $user->company && $user->battalion,
        ];
        
        if ($debug['should_filter']) {
            $cadetCount = \App\Models\User::where('role', 'user')
                ->where('status', 'approved')
                ->where('archived', false)
                ->where('company', $user->company)
                ->where('battalion', $user->battalion)
                ->count();
            $debug['filtered_cadet_count'] = $cadetCount;
        }
        
        $debug['total_cadets'] = \App\Models\User::where('role', 'user')
            ->where('status', 'approved')
            ->where('archived', false)
            ->count();
            
        return response()->json($debug);
    });

    Route::get('/faculty/facultyReportAnIssue', [App\Http\Controllers\IssueController::class, 'facultyReportForm']);
    
    Route::get('/faculty/change-password', function () {
        return Inertia::render('faculty/facultyChangePassword');
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
    Route::get('/user/rotc-grade-breakdown', [UserController::class, 'getUserRotcGradeBreakdown']);
    Route::post('/change-password', [App\Http\Controllers\PasswordController::class, 'changePassword']);
    
    // Attendance endpoints for all authenticated users
    Route::get('/attendance/cadets', [AttendanceController::class, 'getCadets']);
    Route::get('/attendance/{userId}', [AttendanceController::class, 'getUserAttendance']);
    
    // Issue reporting endpoints
    Route::post('/issues', [App\Http\Controllers\IssueController::class, 'store']);
    Route::get('/user-issues', [App\Http\Controllers\IssueController::class, 'userIssues']);
    
    // Admin-only API endpoints
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/admin-cadets', [App\Http\Controllers\GradeController::class, 'getAdminMasterlistGrades']);
        Route::get('/admin-semesters', [App\Http\Controllers\GradeController::class, 'getAvailableSemesters']);
        Route::get('/admin-cadets-by-semester/{semester?}', [App\Http\Controllers\GradeController::class, 'getCadetsBySemester']);
        Route::get('/top-cadet', [App\Http\Controllers\GradeController::class, 'getTopCadet']);
        Route::post('/admin/change-password', [App\Http\Controllers\PasswordController::class, 'adminChangePassword']);
        Route::post('/admin/add-user', [AdminController::class, 'addUser']);
        
        // Issue management endpoints for admins
        Route::get('/all-issues', [App\Http\Controllers\IssueController::class, 'getAllIssues']);
        Route::put('/issues/{id}', [App\Http\Controllers\IssueController::class, 'update']);
        
        // Attendance API endpoints for admin
        Route::get('/attendance', [AttendanceController::class, 'getAllAttendance']);
        // Note: /attendance/cadets and /attendance/{userId} are available to all authenticated users above
        Route::post('/attendance/update', [AttendanceController::class, 'updateAttendance']);
        Route::post('/attendance/bulk-update', [AttendanceController::class, 'bulkUpdateAttendance']);
        Route::post('/attendance/fingerprint-scan', [AttendanceController::class, 'fingerprintScan']);
        Route::post('/attendance/import', [AttendanceController::class, 'importAttendanceData']);
        Route::post('/fingerprint/register', [AttendanceController::class, 'registerFingerprint']);
        Route::get('/fingerprint/check-connection', [AttendanceController::class, 'checkScannerConnection']);
        Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
        Route::post('/approve-user', [AdminController::class, 'approveUser']);
        Route::post('/reject-user', [AdminController::class, 'rejectUser']);
        Route::post('/archive-user', [AdminController::class, 'archiveUser']);
        Route::post('/restore-user', [AdminController::class, 'restoreUser']);
        Route::post('/restore-all-users', [AdminController::class, 'restoreAllUsers']);
        Route::get('/archived-users', [AdminController::class, 'getArchivedUsers']);
    });
    
    // Faculty-only API endpoints
    Route::middleware(FacultyMiddleware::class)->group(function () {
        Route::get('/cadets', [UserController::class, 'getCadets']);
        Route::get('/merits', [UserController::class, 'getMerits']);
        Route::post('/merits/save', [UserController::class, 'saveMerits']);
        
        // Semester-specific merits API endpoints
        Route::get('/first_semester_aptitude', [UserController::class, 'getFirstSemesterMerits']);
        Route::post('/first_semester_aptitude/save', [UserController::class, 'saveFirstSemesterMerits']);
        Route::get('/second_semester_aptitude', [UserController::class, 'getSecondSemesterMerits']);
        Route::post('/second_semester_aptitude/save', [UserController::class, 'saveSecondSemesterMerits']);
        
        Route::post('/faculty/change-password', [App\Http\Controllers\PasswordController::class, 'facultyChangePassword']);
        
        // Faculty-specific attendance API endpoints
        Route::get('/faculty-attendance', [AttendanceController::class, 'getAllAttendance']);
        Route::get('/faculty-attendance/{userId}', [AttendanceController::class, 'getUserAttendance']);
        
        // Final Grades API endpoints for faculty
        Route::get('/final-grades', [App\Http\Controllers\FinalGradesController::class, 'getFinalGrades']);
        Route::post('/final-grades/post', [App\Http\Controllers\FinalGradesController::class, 'postGrades']);
        Route::post('/final-grades/common-module', [App\Http\Controllers\FinalGradesController::class, 'updateCommonModuleGrade']);
    });
    
    // Faculty exam scores API endpoints
    Route::middleware(FacultyMiddleware::class)->group(function () {
        Route::get('/exams', [App\Http\Controllers\ExamController::class, 'getExamScores']);
        Route::post('/exams/save', [App\Http\Controllers\ExamController::class, 'saveExamScores']);
        // Backward-compatible aliases for older frontend paths
        Route::get('/api/exams', [App\Http\Controllers\ExamController::class, 'getExamScores']);
        Route::post('/api/exams/save', [App\Http\Controllers\ExamController::class, 'saveExamScores']);
        Route::get('/common-module', [App\Http\Controllers\CommonModuleController::class, 'get']);
        Route::post('/common-module/save', [App\Http\Controllers\CommonModuleController::class, 'save']);
    });
    
    
    // ROTC Grade Calculation API endpoints for faculty
    Route::middleware(FacultyMiddleware::class)->group(function () {
        Route::get('/rotc-grades', [App\Http\Controllers\RotcGradeController::class, 'getRotcGrades']);
        Route::get('/rotc-grades/stored', [App\Http\Controllers\RotcGradeController::class, 'getStoredGrades']);
        Route::get('/rotc-grades/cadet/{userId}', [App\Http\Controllers\RotcGradeController::class, 'getCadetGradeBreakdown']);
        Route::get('/rotc-grades/summary', [App\Http\Controllers\RotcGradeController::class, 'getGradeSummary']);
        Route::post('/rotc-grades/calculate', [App\Http\Controllers\RotcGradeController::class, 'calculateAndSaveGrades']);
        Route::post('/rotc-grades/recalculate', [App\Http\Controllers\RotcGradeController::class, 'recalculateAllGrades']);
    });
    
    // Equivalent Grades API endpoints - not in API group
    Route::get('/grade-equivalents', [App\Http\Controllers\GradeController::class, 'getEquivalentGrades']);
    Route::post('/grade-equivalents/save', [App\Http\Controllers\GradeController::class, 'saveEquivalentGrades']);
    Route::post('/grade-equivalents/update', [App\Http\Controllers\GradeController::class, 'updateEquivalentGrade']);
    Route::post('/grade-equivalents/calculate', [App\Http\Controllers\GradeController::class, 'calculateAndUpdateGrades']);

// Temporary debug route to check authentication
Route::get('/debug-auth', function () {
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => auth()->user(),
        'role' => auth()->user()?->role ?? 'none'
    ]);
});
});