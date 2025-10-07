<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== DEBUGGING GALVEZ 2ND SEMESTER ISSUE ===\n\n";

$semester = '2025-2026 2nd semester';

// Find Galvez
$galvez = DB::table('users')->where('last_name', 'LIKE', '%Galvez%')->first();
if (!$galvez) {
    echo "Galvez not found, trying different search...\n";
    $galvez = DB::table('users')->where('first_name', 'LIKE', '%Galvez%')->first();
}

if (!$galvez) {
    echo "Still not found, showing all users with 'Galvez' or 'Toby':\n";
    $users = DB::table('users')->where('first_name', 'LIKE', '%Toby%')->orWhere('last_name', 'LIKE', '%Toby%')->orWhere('first_name', 'LIKE', '%Galvez%')->orWhere('last_name', 'LIKE', '%Galvez%')->get();
    foreach ($users as $user) {
        echo "  ID: {$user->id}, Name: {$user->first_name} {$user->last_name}\n";
    }
    
    // Use the first one found
    $galvez = $users->first();
}

if ($galvez) {
    echo "Testing with Galvez: {$galvez->first_name} {$galvez->last_name} (ID: {$galvez->id})\n\n";
    
    // Check raw exam data
    echo "--- RAW EXAM DATA ---\n";
    $examData = DB::table('second_semester_exam_scores')
        ->where('user_id', $galvez->id)
        ->where('semester', $semester)
        ->get();
        
    echo "Found " . count($examData) . " exam records:\n";
    foreach ($examData as $exam) {
        echo "  ID: {$exam->id}\n";
        echo "  midterm_exam: {$exam->midterm_exam}\n";
        echo "  final_exam: {$exam->final_exam}\n";
        echo "  subject_prof: {$exam->subject_prof}\n";
        echo "  updated_at: {$exam->updated_at}\n\n";
    }
    
    // Check attendance data
    echo "--- RAW ATTENDANCE DATA ---\n";
    $attendanceData = DB::table('second_semester_attendance')
        ->where('user_id', $galvez->id)
        ->where('semester', $semester)
        ->get();
        
    echo "Found " . count($attendanceData) . " attendance records:\n";
    foreach ($attendanceData as $att) {
        echo "  ID: {$att->id}\n";
        echo "  attendance_30: {$att->attendance_30}\n";
        echo "  weeks_present: {$att->weeks_present}\n";
        echo "  updated_at: {$att->updated_at}\n\n";
    }
    
    // Check aptitude data
    echo "--- RAW APTITUDE DATA ---\n";
    $aptitudeData = DB::table('second_semester_aptitude')
        ->where('cadet_id', $galvez->id)
        ->where('semester', $semester)
        ->get();
        
    echo "Found " . count($aptitudeData) . " aptitude records:\n";
    foreach ($aptitudeData as $apt) {
        echo "  ID: {$apt->id}\n";
        echo "  aptitude_30: {$apt->aptitude_30}\n";
        echo "  total_merits: {$apt->total_merits}\n";
        echo "  updated_at: {$apt->updated_at}\n\n";
    }
    
    // Test individual calculations
    echo "--- CALCULATION BREAKDOWN ---\n";
    $controller = new FinalGradesController();
    $reflection = new ReflectionClass($controller);
    
    $aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
    $aptitudeMethod->setAccessible(true);
    $aptitude = $aptitudeMethod->invoke($controller, $galvez->id, $semester);
    
    $attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
    $attendanceMethod->setAccessible(true);
    $attendance = $attendanceMethod->invoke($controller, $galvez->id, $semester);
    
    $examMethod = $reflection->getMethod('calculateSecondSemesterExam');
    $examMethod->setAccessible(true);
    $exam = $examMethod->invoke($controller, $galvez->id, $semester);
    
    echo "Aptitude Score: $aptitude\n";
    echo "Attendance Score: $attendance\n";
    echo "Exam Score: $exam\n";
    echo "TOTAL ROTC Grade: " . ($aptitude + $attendance + $exam) . "\n\n";
    
    // Test the main getROTCGrade method
    $getROTCMethod = $reflection->getMethod('getROTCGrade');
    $getROTCMethod->setAccessible(true);
    $rotcGrade = $getROTCMethod->invoke($controller, $galvez->id, $semester);
    
    echo "getROTCGrade result: $rotcGrade\n";
}