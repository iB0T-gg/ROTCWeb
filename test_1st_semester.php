<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING 1ST SEMESTER FINAL GRADES ===\n\n";

use App\Http\Controllers\FinalGradesController;
use Illuminate\Http\Request;

$controller = new FinalGradesController();

// Test 1st semester
$semester = '2025-2026 1st semester';
echo "Testing semester: $semester\n";
echo "=================================\n";

$request = new Request(['semester' => $semester]);
$response = $controller->getFinalGrades($request);

if ($response->getStatusCode() === 200) {
    echo "API Response Status: " . $response->getStatusCode() . "\n";
    
    $data = json_decode($response->getContent(), true);
    echo "Total Cadets: " . count($data) . "\n";
    
    // Look for Willis specifically
    foreach ($data as $cadet) {
        if (strpos($cadet['first_name'], 'Willis') !== false) {
            echo "Found Willis: " . $cadet['first_name'] . " " . $cadet['last_name'] . "\n";
            echo "  - ROTC Grade: " . $cadet['rotc_grade'] . "\n";
            echo "  - Final Grade: " . $cadet['final_grade'] . "\n";
            echo "  - Common Module: " . $cadet['common_module_grade'] . "\n";
            echo "  - Equivalent Grade: " . $cadet['equivalent_grade'] . "\n";
            echo "  - Remarks: " . $cadet['remarks'] . "\n";
            break;
        }
    }
    
    // Also show all cadets for reference
    echo "\nAll cadets:\n";
    foreach ($data as $cadet) {
        echo "- " . $cadet['first_name'] . " " . $cadet['last_name'] . " (ROTC: " . $cadet['rotc_grade'] . ", Final: " . $cadet['final_grade'] . ")\n";
    }
} else {
    echo "Error: " . $response->getStatusCode() . "\n";
    echo $response->getContent() . "\n";
}