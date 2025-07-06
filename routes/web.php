<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/Login');
});

Route::get('/register', function () {
    return Inertia::render('auth/Register');
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

    Route::get('/user/userHome', function () {
    return Inertia::render('user/userHome');
    });

    // API routes
    Route::prefix('api')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
        Route::post('/approve-user', [AdminController::class, 'approveUser']);
        Route::post('/reject-user', [AdminController::class, 'rejectUser']);
    });
});