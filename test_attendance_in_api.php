<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING FINAL GRADES API WITH ATTENDANCE DATA ===\n\n";

try {
    // Create a test request
    $request = new \Illuminate\Http\Request();
    $request->merge(['semester' => '2025-2026 1st semester']);
    
    // Create controller instance
    $controller = new \App\Http\Controllers\FinalGradesController();
    
    // Call the method
    $response = $controller->getFinalGrades($request);
    
    // Get the data
    $data = json_decode($response->getContent(), true);
    
    // Show first cadet with attendance data
    $firstCadet = $data[0];
    echo "CADET: {$firstCadet['last_name']}, {$firstCadet['first_name']} (ID: {$firstCadet['id']})\n";
    echo "  - ROTC Grade: " . $firstCadet['rotc_grade'] . "\n";
    echo "  - Final Grade: " . $firstCadet['final_grade'] . "\n";
    
    if (isset($firstCadet['attendance_data'])) {
        echo "  - Attendance Data:\n";
        echo "    - Weeks Present: " . $firstCadet['attendance_data']['weeks_present'] . "\n";
        echo "    - Attendance 30: " . $firstCadet['attendance_data']['attendance_30'] . "\n";
        echo "    - Percentage: " . $firstCadet['attendance_data']['percentage'] . "%\n";
        echo "    - Weekly Attendance: " . json_encode($firstCadet['attendance_data']['weekly_attendance']) . "\n";
    } else {
        echo "  - No attendance data found\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}