<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING FINAL GRADES API ===\n\n";

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
    
    echo "API Response Status: " . $response->getStatusCode() . "\n";
    echo "Total Cadets: " . count($data) . "\n\n";
    
    // Show first 3 cadets
    foreach (array_slice($data, 0, 3) as $cadet) {
        echo "CADET: {$cadet['last_name']}, {$cadet['first_name']} (ID: {$cadet['id']})\n";
        echo "  - Common Module Grade: " . ($cadet['common_module_grade'] ?? 'NULL') . "\n";
        echo "  - ROTC Grade: " . ($cadet['rotc_grade'] ?? 'NULL') . "\n";
        echo "  - Final Grade: " . ($cadet['final_grade'] ?? 'NULL') . "\n";
        echo "  - Equivalent Grade: " . ($cadet['equivalent_grade'] ?? 'NULL') . "\n";
        echo "  - Remarks: " . ($cadet['remarks'] ?? 'NULL') . "\n\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}