<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING WILLIS IN FINAL GRADES API ===\n\n";

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
    
    // Find Willis Aufderhar
    $willis = null;
    foreach ($data as $cadet) {
        if ($cadet['first_name'] === 'Willis' && $cadet['last_name'] === 'Aufderhar') {
            $willis = $cadet;
            break;
        }
    }
    
    if ($willis) {
        echo "FOUND WILLIS!\n";
        echo "  - Common Module Grade: " . $willis['common_module_grade'] . "\n";
        echo "  - ROTC Grade: " . $willis['rotc_grade'] . "\n";
        echo "  - Final Grade: " . $willis['final_grade'] . "\n";
        echo "  - Equivalent Grade: " . $willis['equivalent_grade'] . "\n";
        echo "  - Remarks: " . $willis['remarks'] . "\n";
        
        if (isset($willis['attendance_data'])) {
            echo "  - Attendance Score: " . $willis['attendance_data']['attendance_30'] . "\n";
        }
    } else {
        echo "Willis not found in API response\n";
        echo "Available cadets:\n";
        foreach (array_slice($data, 0, 5) as $cadet) {
            echo "  - {$cadet['first_name']} {$cadet['last_name']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}