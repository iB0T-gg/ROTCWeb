<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== TESTING WILLIS AND TEST CADET ===\n\n";

$controller = new FinalGradesController();
$semester = '2025-2026 2nd semester';

// Test Willis
$willis = DB::table('users')->where('first_name', 'Willis')->first();
if ($willis) {
    echo "WILLIS AUFDERHAR (ID: {$willis->id})\n";
    echo "================================\n";
    
    $reflection = new ReflectionClass($controller);
    
    $aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
    $aptitudeMethod->setAccessible(true);
    $aptitude = $aptitudeMethod->invoke($controller, $willis->id, $semester);
    
    $attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
    $attendanceMethod->setAccessible(true);
    $attendance = $attendanceMethod->invoke($controller, $willis->id, $semester);
    
    $examMethod = $reflection->getMethod('calculateSecondSemesterExam');
    $examMethod->setAccessible(true);
    $exam = $examMethod->invoke($controller, $willis->id, $semester);
    
    echo "  Aptitude: $aptitude\n";
    echo "  Attendance: $attendance\n";
    echo "  Exam: $exam\n";
    echo "  TOTAL: " . ($aptitude + $attendance + $exam) . "\n\n";
    
    // Show Willis's raw data
    $willisAtt = DB::table('second_semester_attendance')->where('user_id', $willis->id)->where('semester', $semester)->first();
    $willisExam = DB::table('second_semester_exam_scores')->where('user_id', $willis->id)->where('semester', $semester)->first();
    $willisApt = DB::table('second_semester_aptitude')->where('cadet_id', $willis->id)->where('semester', $semester)->first();
    
    echo "  Raw data:\n";
    echo "    Attendance: attendance_30={$willisAtt->attendance_30}, weeks_present={$willisAtt->weeks_present}\n";
    echo "    Exam: midterm={$willisExam->midterm_exam}, final={$willisExam->final_exam}, subject_prof={$willisExam->subject_prof}\n";
    echo "    Aptitude: aptitude_30={$willisApt->aptitude_30}, total_merits={$willisApt->total_merits}\n\n";
}

// Test Test Cadet
$testCadet = DB::table('users')->where('first_name', 'Test')->where('last_name', 'Cadet')->first();
if ($testCadet) {
    echo "TEST CADET (ID: {$testCadet->id})\n";
    echo "============================\n";
    
    $reflection = new ReflectionClass($controller);
    
    $aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
    $aptitudeMethod->setAccessible(true);
    $aptitude = $aptitudeMethod->invoke($controller, $testCadet->id, $semester);
    
    $attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
    $attendanceMethod->setAccessible(true);
    $attendance = $attendanceMethod->invoke($controller, $testCadet->id, $semester);
    
    $examMethod = $reflection->getMethod('calculateSecondSemesterExam');
    $examMethod->setAccessible(true);
    $exam = $examMethod->invoke($controller, $testCadet->id, $semester);
    
    echo "  Aptitude: $aptitude\n";
    echo "  Attendance: $attendance\n";
    echo "  Exam: $exam\n";
    echo "  TOTAL: " . ($aptitude + $attendance + $exam) . "\n\n";
}