<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING GALVEZ EXAM RECORDS IN ALL SEMESTERS ===\n\n";

$galvezIds = [14, 15, 16, 17];

echo "Checking second_semester_exam_scores:\n";
$secondSemExams = DB::table('second_semester_exam_scores')
    ->whereIn('user_id', $galvezIds)
    ->get();
    
echo "Found " . count($secondSemExams) . " records\n";
foreach ($secondSemExams as $exam) {
    echo "  User ID: {$exam->user_id}, Semester: {$exam->semester}, Midterm: {$exam->midterm_exam}, Final: {$exam->final_exam}, Updated: {$exam->updated_at}\n";
}

echo "\nChecking first_semester_exam_scores:\n";
$firstSemExams = DB::table('first_semester_exam_scores')
    ->whereIn('user_id', $galvezIds)
    ->get();
    
echo "Found " . count($firstSemExams) . " records\n";
foreach ($firstSemExams as $exam) {
    echo "  User ID: {$exam->user_id}, Semester: {$exam->semester}, Midterm: {$exam->midterm_exam}, Final: {$exam->final_exam}, Updated: {$exam->updated_at}\n";
}

// Try to insert a test record to see if it works
echo "\n=== TESTING RECORD INSERTION ===\n";
try {
    $testInsert = DB::table('second_semester_exam_scores')->insert([
        'user_id' => 14,
        'midterm_exam' => 80,
        'final_exam' => 90,
        'average' => null,
        'subject_prof' => 0,
        'semester' => '2025-2026 2nd semester',
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    if ($testInsert) {
        echo "✓ Successfully inserted test record for Galvez (ID: 14)\n";
        
        // Now check if it appears
        $newRecord = DB::table('second_semester_exam_scores')
            ->where('user_id', 14)
            ->where('semester', '2025-2026 2nd semester')
            ->first();
            
        if ($newRecord) {
            echo "✓ Test record found: midterm={$newRecord->midterm_exam}, final={$newRecord->final_exam}\n";
            
            // Test the calculation
            echo "✓ Calculated exam score would be: " . (($newRecord->midterm_exam + $newRecord->final_exam) / 2 * 0.40) . "\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Error inserting test record: " . $e->getMessage() . "\n";
}