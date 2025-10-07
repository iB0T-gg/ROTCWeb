<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING ALL POSSIBLE SECOND SEMESTER TABLES ===\n\n";

// Check all tables that might be used for second semester
$potentialTables = [
    'second_semester_attendance',
    'second_semester_exam_scores', 
    'second_semester_merit',
    'second_semester_aptitude',
    'second_semester_merits' // plural version
];

foreach ($potentialTables as $table) {
    try {
        $exists = DB::select("SHOW TABLES LIKE '$table'");
        if (!empty($exists)) {
            echo "✓ Table $table EXISTS\n";
            
            // Check row count
            $count = DB::select("SELECT COUNT(*) as count FROM $table");
            echo "  - Records: " . $count[0]->count . "\n";
            
            // Show column structure
            $columns = DB::select("DESCRIBE $table");
            echo "  - Columns: ";
            foreach ($columns as $col) {
                echo $col->Field . " ";
            }
            echo "\n";
            
            // Show first record if any
            if ($count[0]->count > 0) {
                $sample = DB::select("SELECT * FROM $table LIMIT 1");
                echo "  - Sample record: ";
                foreach ((array)$sample[0] as $key => $value) {
                    echo "$key=$value ";
                }
                echo "\n";
            }
        } else {
            echo "✗ Table $table DOES NOT EXIST\n";
        }
    } catch (Exception $e) {
        echo "✗ Error checking $table: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

// Check what happens when we try to calculate grades
echo "=== DEBUGGING SECOND SEMESTER GRADE CALCULATION ===\n";

use App\Http\Controllers\FinalGradesController;

$controller = new FinalGradesController();
$sampleUser = DB::table('users')->where('role', 'user')->first();

if ($sampleUser) {
    echo "Testing with user: " . $sampleUser->first_name . " " . $sampleUser->last_name . " (ID: " . $sampleUser->id . ")\n\n";
    
    // Use reflection to test each method individually
    $reflection = new ReflectionClass($controller);
    
    $methods = ['calculateSecondSemesterAptitude', 'calculateSecondSemesterAttendance', 'calculateSecondSemesterExam'];
    
    foreach ($methods as $methodName) {
        try {
            $method = $reflection->getMethod($methodName);
            $method->setAccessible(true);
            
            $result = $method->invoke($controller, $sampleUser->id, '2025-2026 2nd semester');
            echo "$methodName: $result\n";
        } catch (Exception $e) {
            echo "$methodName: ERROR - " . $e->getMessage() . "\n";
        }
    }
}