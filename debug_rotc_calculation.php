<?php

require_once __DIR__ . '/vendor/autoload.php';
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== DEBUGGING ROTC GRADE CALCULATION ===\n\n";

$userId = 3; // Test cadet
$semester = '2025-2026 1st semester';

try {
    echo "Checking calculation components for User ID: $userId\n";
    echo "Semester: $semester\n\n";
    
    // Check aptitude_30 from first_semester_aptitude
    $aptitude = DB::table('first_semester_aptitude')
        ->where('cadet_id', $userId)
        ->first();
    
    echo "=== APTITUDE DATA ===\n";
    if ($aptitude) {
        echo "aptitude_30: " . ($aptitude->aptitude_30 ?? 'NULL') . "\n";
        echo "total_merits: " . ($aptitude->total_merits ?? 'NULL') . "\n";
        // Show weekly data
        echo "Weekly merits: ";
        for ($i = 1; $i <= 10; $i++) {
            $merit = $aptitude->{"merits_week_$i"} ?? 'NULL';
            $demerit = $aptitude->{"demerits_week_$i"} ?? 'NULL';
            echo "W$i:$merit/$demerit ";
        }
        echo "\n";
    } else {
        echo "No aptitude record found\n";
    }
    
    // Check attendance_30 from first_semester_attendance
    $attendance = DB::table('first_semester_attendance')
        ->where('user_id', $userId)
        ->where('semester', $semester)
        ->first();
        
    echo "\n=== ATTENDANCE DATA ===\n";
    if ($attendance) {
        echo "attendance_30: " . ($attendance->attendance_30 ?? 'NULL') . "\n";
        echo "percentage: " . ($attendance->percentage ?? 'NULL') . "\n";
    } else {
        echo "No attendance record found\n";
    }
    
    // Check exam scores
    $exam = DB::table('first_semester_exam_scores')
        ->where('user_id', $userId)
        ->where('semester', $semester)
        ->first();
        
    echo "\n=== EXAM DATA ===\n";
    if ($exam) {
        echo "average: " . ($exam->average ?? 'NULL') . "\n";
        echo "written: " . ($exam->written ?? 'NULL') . "\n";
        echo "practical: " . ($exam->practical ?? 'NULL') . "\n";
        echo "percentage: " . ($exam->percentage ?? 'NULL') . "\n";
        
        // Calculate subject prof score like the controller does
        $average = $exam->average ? (float) $exam->average : 0.0;
        $subjectProfScore = min(40, round($average * 0.40));
        echo "Calculated Subject Prof Score: $subjectProfScore\n";
    } else {
        echo "No exam record found\n";
    }
    
    // Manual calculation
    $aptitude30 = $aptitude ? (int) $aptitude->aptitude_30 : 0;
    $attendance30 = $attendance ? (int) $attendance->attendance_30 : 0;
    $subjectProfScore = 0;
    if ($exam) {
        $average = $exam->average ? (float) $exam->average : 0.0;
        $subjectProfScore = min(40, round($average * 0.40));
    }
    
    $rotcGrade = $aptitude30 + $attendance30 + $subjectProfScore;
    
    echo "\n=== FINAL CALCULATION ===\n";
    echo "Aptitude 30: $aptitude30\n";
    echo "Attendance 30: $attendance30\n";
    echo "Subject Prof Score: $subjectProfScore\n";
    echo "ROTC Grade: $rotcGrade\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}