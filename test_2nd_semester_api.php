<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\FinalGradesController;
use Illuminate\Http\Request;

echo "Testing 2nd semester final grades API...\n\n";

$controller = new FinalGradesController();
$request = new Request(['semester' => '2025-2026 2nd semester', 'force_refresh' => 1]);

try {
    $response = $controller->getFinalGrades($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Found " . count($data) . " cadets for 2nd semester\n\n";
    
    if (count($data) > 0) {
        $cadet = $data[0];
        echo "Sample cadet data:\n";
        echo "ID: " . $cadet['id'] . "\n";
        echo "Name: " . $cadet['first_name'] . " " . $cadet['last_name'] . "\n";
        echo "ROTC Grade: " . $cadet['rotc_grade'] . "\n";
        echo "Final Grade: " . $cadet['final_grade'] . "\n";
        echo "Equivalent Grade: " . $cadet['equivalent_grade'] . "\n";
        echo "Has aptitude_data: " . (isset($cadet['aptitude_data']) ? 'Yes' : 'No') . "\n";
        echo "Has exam_data: " . (isset($cadet['exam_data']) ? 'Yes' : 'No') . "\n";
        
        if (isset($cadet['aptitude_data'])) {
            echo "Aptitude 30: " . $cadet['aptitude_data']['aptitude_30'] . "\n";
            echo "Total merits: " . $cadet['aptitude_data']['total_merits'] . "\n";
            echo "Merits array length: " . count($cadet['aptitude_data']['merits_array']) . "\n";
        }
        
        if (isset($cadet['exam_data'])) {
            echo "Midterm: " . $cadet['exam_data']['midterm_exam'] . "\n";
            echo "Final exam: " . $cadet['exam_data']['final_exam'] . "\n";
        }
        
        if (isset($cadet['attendance_data'])) {
            echo "Attendance 30: " . $cadet['attendance_data']['attendance_30'] . "\n";
            echo "Weeks present: " . $cadet['attendance_data']['weeks_present'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}