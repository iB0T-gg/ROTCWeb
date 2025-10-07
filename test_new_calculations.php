<?php

require_once __DIR__ . '/vendor/autoload.php';
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING NEW CALCULATION METHODS ===\n\n";

$userId = 3;
$semester = '2025-2026 1st semester';

// Create controller instance to test private methods
$controllerClass = new ReflectionClass('App\Http\Controllers\FinalGradesController');
$controller = $controllerClass->newInstance();

// Test aptitude calculation
$aptitudeMethod = $controllerClass->getMethod('calculateAptitudePercentage');
$aptitudeMethod->setAccessible(true);
$aptitudeScore = $aptitudeMethod->invokeArgs($controller, [$userId, $semester]);

echo "Aptitude Score: $aptitudeScore\n";

// Test attendance calculation
$attendanceMethod = $controllerClass->getMethod('calculateAttendancePercentage');
$attendanceMethod->setAccessible(true);
$attendanceScore = $attendanceMethod->invokeArgs($controller, [$userId, $semester]);

echo "Attendance Score: $attendanceScore\n";

// Test exam calculation
$examMethod = $controllerClass->getMethod('calculateExamPercentage');
$examMethod->setAccessible(true);
$examScore = $examMethod->invokeArgs($controller, [$userId, $semester]);

echo "Exam Score: $examScore\n";

echo "Total ROTC Grade: " . ($aptitudeScore + $attendanceScore + $examScore) . "\n";

// Let's also check the weekly attendance data
echo "\n=== WEEKLY ATTENDANCE DATA ===\n";
$attendance = DB::table('first_semester_attendance')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->first();

if ($attendance) {
    echo "Weekly attendance columns:\n";
    for ($i = 1; $i <= 10; $i++) {
        $weekColumn = "week_{$i}";
        $value = isset($attendance->$weekColumn) ? ($attendance->$weekColumn ? 'Present' : 'Absent') : 'NULL';
        echo "  Week $i: $value\n";
    }
} else {
    echo "No attendance record found\n";
}