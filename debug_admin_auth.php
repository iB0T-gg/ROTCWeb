<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Authentication Debug ===\n\n";

// Check if there's a current user in the session
if (auth()->check()) {
    $user = auth()->user();
    echo "User is authenticated:\n";
    echo "   Name: {$user->first_name} {$user->last_name}\n";
    echo "   Email: {$user->email}\n";
    echo "   Role: {$user->role}\n";
    echo "   Status: {$user->status}\n";
    echo "   ID: {$user->id}\n\n";
    
    if ($user->role === 'admin') {
        echo "User has admin role - should have access to attendance\n";
    } else {
        echo "User does not have admin role: {$user->role}\n";
    }
} else {
    echo " No user is currently authenticated\n";
    echo "   Session ID: " . session()->getId() . "\n";
    echo "   Session driver: " . config('session.driver') . "\n";
}

echo "\n=== Testing Attendance API ===\n";

// Test the attendance API directly
try {
    $controller = new \App\Http\Controllers\AttendanceController();
    $request = new \Illuminate\Http\Request();
    $request->merge(['semester' => '2025-2026 1st semester']);
    
    $response = $controller->getCadets($request);
    $data = json_decode($response->getContent(), true);
    
    echo "API Response Status: " . $response->getStatusCode() . "\n";
    echo "API Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    
    if ($data['success']) {
        echo "Cadets returned: " . count($data['data']) . "\n";
    } else {
        echo "Error message: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\n=== Route and Middleware Check ===\n";

// Check if the route exists
$routes = app('router')->getRoutes();
$attendanceRoute = null;
foreach ($routes as $route) {
    if ($route->uri() === 'api/attendance/cadets') {
        $attendanceRoute = $route;
        break;
    }
}

if ($attendanceRoute) {
    echo "Route exists: /api/attendance/cadets\n";
    echo "   Methods: " . implode(', ', $attendanceRoute->methods()) . "\n";
    echo "   Middleware: " . implode(', ', $attendanceRoute->middleware()) . "\n";
    echo "   Action: " . $attendanceRoute->getActionName() . "\n";
} else {
    echo "Route not found: /api/attendance/cadets\n";
}