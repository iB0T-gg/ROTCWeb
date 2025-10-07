<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;
use Illuminate\Http\Request;

echo "=== TESTING GRADE ACCURACY AFTER FRONTEND FIXES ===\n\n";

$controller = new FinalGradesController();

// Test both semesters
$semesters = ['2025-2026 1st semester', '2025-2026 2nd semester'];

foreach ($semesters as $semester) {
    echo "Testing $semester:\n";
    echo "=" . str_repeat("=", strlen($semester) + 8) . "\n\n";
    
    $request = new Request();
    $request->merge(['semester' => $semester]);
    
    try {
        $response = $controller->getFinalGrades($request);
        $gradesData = json_decode($response->getContent(), true);
        
        if (empty($gradesData)) {
            echo "   ⚠ No data returned for $semester\n\n";
            continue;
        }
        
        echo "   Backend data structure verification:\n";
        $sampleStudent = $gradesData[0];
        echo "   Sample student keys: " . implode(', ', array_keys($sampleStudent)) . "\n\n";
        
        echo "   Grade accuracy test (first 3 students):\n";
        
        for ($i = 0; $i < min(3, count($gradesData)); $i++) {
            $student = $gradesData[$i];
            
            echo "   Student: {$student['first_name']} {$student['last_name']}\n";
            echo "     Backend values:\n";
            echo "       Common Module: " . ($student['common_module_grade'] ?? 'null') . "\n";
            echo "       ROTC Grade: " . ($student['rotc_grade'] ?? 'null') . "\n";
            echo "       Final Grade: " . ($student['final_grade'] ?? 'null') . "\n";
            echo "       Equivalent Grade: " . ($student['equivalent_grade'] ?? 'null') . "\n";
            echo "       Remarks: " . ($student['remarks'] ?? 'null') . "\n";
            
            // Verify remarks computation
            $eq = (float) ($student['equivalent_grade'] ?? 0);
            $expectedRemarks = ($eq === 4.0) ? 'Incomplete' : (($eq > 4.0) ? 'Failed' : 'Passed');
            $actualRemarks = $student['remarks'] ?? 'null';
            
            $remarksStatus = ($actualRemarks === $expectedRemarks) ? '✓' : '✗';
            echo "     Remarks check: $remarksStatus Expected '$expectedRemarks', Got '$actualRemarks'\n";
            
            // Check if all required fields are present
            $requiredFields = ['rotc_grade', 'final_grade', 'equivalent_grade', 'remarks'];
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (!isset($student[$field]) || $student[$field] === null) {
                    $missingFields[] = $field;
                }
            }
            
            if (empty($missingFields)) {
                echo "     ✓ All required fields present\n";
            } else {
                echo "     ✗ Missing fields: " . implode(', ', $missingFields) . "\n";
            }
            
            echo "\n";
        }
        
        // Check for any students with null/missing grades
        $nullGrades = array_filter($gradesData, function($student) {
            return $student['final_grade'] === null || $student['equivalent_grade'] === null;
        });
        
        if (count($nullGrades) > 0) {
            echo "   ⚠ Found " . count($nullGrades) . " students with null grades:\n";
            foreach ($nullGrades as $student) {
                echo "     - {$student['first_name']} {$student['last_name']}: Final={$student['final_grade']}, Equivalent={$student['equivalent_grade']}\n";
            }
        } else {
            echo "   ✓ All students have complete grade data\n";
        }
        
    } catch (Exception $e) {
        echo "   ✗ Error testing $semester: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

echo "=== TESTING SPECIFIC STUDENTS ===\n\n";

// Test Willis and Galvez specifically
$testUsers = [
    ['name' => 'Willis', 'id' => 9],
    ['name' => 'Galvez', 'id' => 14]
];

foreach ($testUsers as $user) {
    echo "Testing {$user['name']} (ID: {$user['id']}):\n";
    
    foreach ($semesters as $semester) {
        $request = new Request();
        $request->merge(['semester' => $semester]);
        
        try {
            $response = $controller->getFinalGrades($request);
            $gradesData = json_decode($response->getContent(), true);
            
            $studentData = array_filter($gradesData, function($student) use ($user) {
                return $student['id'] == $user['id'];
            });
            
            if (empty($studentData)) {
                echo "   $semester: Not found\n";
                continue;
            }
            
            $student = array_values($studentData)[0];
            echo "   $semester:\n";
            echo "     ROTC: {$student['rotc_grade']}, Final: {$student['final_grade']}, Equiv: {$student['equivalent_grade']}, Remarks: {$student['remarks']}\n";
            
        } catch (Exception $e) {
            echo "   $semester: Error - " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
}

echo "=== GRADE ACCURACY TEST COMPLETE ===\n";