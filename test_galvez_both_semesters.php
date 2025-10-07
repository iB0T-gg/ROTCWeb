<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== TESTING GALVEZ IN BOTH SEMESTERS ===\n\n";

$controller = new FinalGradesController();
$galvezId = 14; // Jewell Toby Galvez

$semesters = ['2025-2026 2nd semester', '2026-2027 2nd semester'];

foreach ($semesters as $semester) {
    echo "--- TESTING SEMESTER: $semester ---\n";
    
    // Check raw data
    $exam = DB::table('second_semester_exam_scores')
        ->where('user_id', $galvezId)
        ->where('semester', $semester)
        ->first();
        
    $attendance = DB::table('second_semester_attendance')
        ->where('user_id', $galvezId)
        ->where('semester', $semester)
        ->first();
        
    $aptitude = DB::table('second_semester_aptitude')
        ->where('cadet_id', $galvezId)
        ->where('semester', $semester)
        ->first();
    
    echo "Raw Data:\n";
    if ($exam) {
        echo "  Exam: midterm={$exam->midterm_exam}, final={$exam->final_exam}\n";
    } else {
        echo "  Exam: NO RECORD\n";
    }
    
    if ($attendance) {
        echo "  Attendance: attendance_30={$attendance->attendance_30}\n";
    } else {
        echo "  Attendance: NO RECORD\n";
    }
    
    if ($aptitude) {
        echo "  Aptitude: aptitude_30={$aptitude->aptitude_30}\n";
    } else {
        echo "  Aptitude: NO RECORD\n";
    }
    
    // Test calculations
    $reflection = new ReflectionClass($controller);
    
    $aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
    $aptitudeMethod->setAccessible(true);
    $aptScore = $aptitudeMethod->invoke($controller, $galvezId, $semester);
    
    $attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
    $attendanceMethod->setAccessible(true);
    $attScore = $attendanceMethod->invoke($controller, $galvezId, $semester);
    
    $examMethod = $reflection->getMethod('calculateSecondSemesterExam');
    $examMethod->setAccessible(true);
    $examScore = $examMethod->invoke($controller, $galvezId, $semester);
    
    echo "Calculated Scores:\n";
    echo "  Aptitude: $aptScore\n";
    echo "  Attendance: $attScore\n";
    echo "  Exam: $examScore\n";
    echo "  TOTAL: " . ($aptScore + $attScore + $examScore) . "\n\n";
}

// Clean up the test record we inserted
echo "Cleaning up test record...\n";
DB::table('second_semester_exam_scores')
    ->where('user_id', 14)
    ->where('semester', '2025-2026 2nd semester')
    ->where('midterm_exam', 80)
    ->where('final_exam', 90)
    ->delete();
echo "Test record removed.\n";