<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking second semester tables:\n\n";

try {
    $aptitudeCount = DB::table('second_semester_aptitude')->count();
    echo "Second semester aptitude records: $aptitudeCount\n";
    
    if ($aptitudeCount > 0) {
        $sample = DB::table('second_semester_aptitude')->first();
        echo "Sample aptitude data: ";
        print_r($sample);
    }
} catch (Exception $e) {
    echo "Second semester aptitude table error: " . $e->getMessage() . "\n";
}

try {
    $attendanceCount = DB::table('second_semester_attendance')->count();
    echo "Second semester attendance records: $attendanceCount\n";
    
    if ($attendanceCount > 0) {
        $sample = DB::table('second_semester_attendance')->first();
        echo "Sample attendance data: ";
        print_r($sample);
    }
} catch (Exception $e) {
    echo "Second semester attendance table error: " . $e->getMessage() . "\n";
}

try {
    $examCount = DB::table('second_semester_exam_scores')->count();
    echo "Second semester exam records: $examCount\n";
    
    if ($examCount > 0) {
        $sample = DB::table('second_semester_exam_scores')->first();
        echo "Sample exam data: ";
        print_r($sample);
    }
} catch (Exception $e) {
    echo "Second semester exam table error: " . $e->getMessage() . "\n";
}

// Check for first semester data for comparison
echo "\n\nFirst semester data for comparison:\n";
try {
    $firstAptitudeCount = DB::table('first_semester_aptitude')->count();
    echo "First semester aptitude records: $firstAptitudeCount\n";
} catch (Exception $e) {
    echo "First semester aptitude table error: " . $e->getMessage() . "\n";
}