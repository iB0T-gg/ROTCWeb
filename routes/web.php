<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Http\Request;

Route::get('/', function () {
    return Inertia::render('auth/Login');
});

Route::get('/register', function () {
    return Inertia::render('auth/Register');
});

Route::get('/register-faculty', function () {
    return Inertia::render('auth/RegisterFaculty');
});

Route::get('/pending', function () {
    return Inertia::render('auth/pending');
})->name('pending');

Route::get('/forgotPassword', function () {
    return Inertia::render('auth/forgotPassword');
})->name('password.request');

Route::get('/reset-password/{token}', function (string $token) {
    return Inertia::render('auth/resetPassword', [
        'token' => $token,
        'email' => request('email'),
    ]);
})->name('password.reset');

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

Route::get('/login', function () {
    return Inertia::render('auth/Login');
})->name('login');

Route::post('/logout', [AuthController::class, 'logout'])
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

Route::middleware('auth')->group(function () {
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

    Route::get('/Issue', function () {
        return Inertia::render('admin/Issue');
    });

    // User routes
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

    // Faculty routes
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

    // API routes
    Route::prefix('api')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
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
        Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
 
        Route::post('/approve-user', [AdminController::class, 'approveUser']);
        Route::post('/reject-user', [AdminController::class, 'rejectUser']);
        Route::post('/user/profile/update', [UserController::class, 'updateProfile']);
        Route::post('/user/profile/upload-avatar', [UserController::class, 'uploadAvatar']);
        Route::get('/merits', [UserController::class, 'getMerits']);
        Route::post('/merits/save', [UserController::class, 'saveMerits']);
        Route::get('/filter-options', [UserController::class, 'getFilterOptions']);
    });

    Route::post('/api/exams/save', function (Request $request) {
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
});