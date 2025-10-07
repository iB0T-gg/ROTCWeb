<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING 2ND SEMESTER FINAL GRADES ===\n\n";

try {
    // Test both semester namings
    $semesters = ['2025-2026 2nd semester', '2026-2027 2nd semester'];
    
    foreach ($semesters as $semester) {
        echo "Testing semester: $semester\n";
        echo "=================================\n";
        
        // Create a test request
        $request = new \Illuminate\Http\Request();
        $request->merge(['semester' => $semester]);
        
        // Create controller instance
        $controller = new \App\Http\Controllers\FinalGradesController();
        
        // Call the method
        $response = $controller->getFinalGrades($request);
        
        // Get the data
        $data = json_decode($response->getContent(), true);
        
        echo "API Response Status: " . $response->getStatusCode() . "\n";
        echo "Total Cadets: " . count($data) . "\n";
        
        // Show first cadet to verify calculation
        if (count($data) > 0) {
            $firstCadet = $data[0];
            echo "First Cadet: {$firstCadet['last_name']}, {$firstCadet['first_name']}\n";
            echo "  - ROTC Grade: " . $firstCadet['rotc_grade'] . "\n";
            echo "  - Final Grade: " . $firstCadet['final_grade'] . "\n";
            echo "  - Common Module: " . $firstCadet['common_module_grade'] . "\n";
        }
        
        echo "\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}