<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING SECOND SEMESTER TABLES ===\n\n";

// Check if second semester tables exist
$tables = ['second_semester_attendance', 'second_semester_exam_scores', 'second_semester_merit'];

foreach ($tables as $table) {
    try {
        $exists = DB::select("SHOW TABLES LIKE '$table'");
        if (!empty($exists)) {
            echo "✓ Table $table EXISTS\n";
            
            // Check row count
            $count = DB::select("SELECT COUNT(*) as count FROM $table");
            echo "  - Records: " . $count[0]->count . "\n";
            
            // Show first few records if any
            if ($count[0]->count > 0) {
                $sample = DB::select("SELECT * FROM $table LIMIT 2");
                echo "  - Sample data:\n";
                foreach ($sample as $row) {
                    echo "    User ID: " . ($row->user_id ?? 'N/A') . ", Semester: " . ($row->semester ?? 'N/A') . "\n";
                }
            }
        } else {
            echo "✗ Table $table DOES NOT EXIST\n";
        }
    } catch (Exception $e) {
        echo "✗ Error checking $table: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

// Also check what's in the getROTCGrade method for second semester
echo "=== TESTING SECOND SEMESTER CALCULATION ===\n";

use App\Http\Controllers\FinalGradesController;

try {
    $controller = new FinalGradesController();
    
    // Get a sample user ID
    $sampleUser = DB::table('users')->where('role', 'user')->first();
    if ($sampleUser) {
        echo "Testing with user ID: " . $sampleUser->id . " (" . $sampleUser->first_name . " " . $sampleUser->last_name . ")\n";
        
        // Use reflection to call private method
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('getROTCGrade');
        $method->setAccessible(true);
        
        $result = $method->invoke($controller, $sampleUser->id, '2025-2026 2nd semester');
        echo "ROTC Grade result: $result\n";
    }
} catch (Exception $e) {
    echo "Error testing calculation: " . $e->getMessage() . "\n";
}