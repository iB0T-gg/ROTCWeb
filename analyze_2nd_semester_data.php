<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DETAILED SECOND SEMESTER DATA ANALYSIS ===\n\n";

$userId = 3; // Test Cadet
$semester = '2025-2026 2nd semester';

echo "Analyzing data for User ID: $userId, Semester: $semester\n\n";

// Check attendance data in detail
echo "--- ATTENDANCE DATA ---\n";
$attendance = DB::table('second_semester_attendance')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->get();

echo "Found " . count($attendance) . " attendance records:\n";
foreach ($attendance as $record) {
    echo "ID: {$record->id}\n";
    echo "  weeks_present: {$record->weeks_present}\n";
    echo "  attendance_30: {$record->attendance_30}\n";
    echo "  Week columns: ";
    for ($i = 1; $i <= 15; $i++) {
        $weekCol = "week_$i";
        echo "$weekCol=" . ($record->$weekCol ?? 'null') . " ";
    }
    echo "\n  created_at: {$record->created_at}\n";
    echo "  updated_at: {$record->updated_at}\n\n";
}

// Check exam data in detail  
echo "--- EXAM DATA ---\n";
$exams = DB::table('second_semester_exam_scores')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->get();

echo "Found " . count($exams) . " exam records:\n";
foreach ($exams as $record) {
    echo "ID: {$record->id}\n";
    echo "  midterm_exam: {$record->midterm_exam}\n";
    echo "  final_exam: {$record->final_exam}\n";
    echo "  average: {$record->average}\n";
    echo "  subject_prof: {$record->subject_prof}\n";
    echo "  created_at: {$record->created_at}\n";
    echo "  updated_at: {$record->updated_at}\n\n";
}

// Check aptitude data in detail
echo "--- APTITUDE DATA ---\n";
$aptitude = DB::table('second_semester_aptitude')
    ->where('cadet_id', $userId)
    ->where('semester', $semester)
    ->get();

echo "Found " . count($aptitude) . " aptitude records:\n";
foreach ($aptitude as $record) {
    echo "ID: {$record->id}\n";
    echo "  total_merits: {$record->total_merits}\n";
    echo "  aptitude_30: {$record->aptitude_30}\n";
    echo "  Some week data: merits_week_1={$record->merits_week_1}, demerits_week_1={$record->demerits_week_1}\n";
    echo "  created_at: {$record->created_at}\n";
    echo "  updated_at: {$record->updated_at}\n\n";
}

// Check what Willis data looks like
echo "--- WILLIS DATA (for comparison) ---\n";
$willis = DB::table('users')->where('first_name', 'Willis')->first();
if ($willis) {
    echo "Willis ID: {$willis->id}\n";
    
    // Willis attendance
    $willisAttendance = DB::table('second_semester_attendance')
        ->where('user_id', $willis->id)
        ->where('semester', $semester)
        ->first();
        
    if ($willisAttendance) {
        echo "Willis attendance_30: {$willisAttendance->attendance_30}\n";
        echo "Willis weeks_present: {$willisAttendance->weeks_present}\n";
    }
    
    // Willis exam
    $willisExam = DB::table('second_semester_exam_scores')
        ->where('user_id', $willis->id)
        ->where('semester', $semester)
        ->first();
        
    if ($willisExam) {
        echo "Willis subject_prof: {$willisExam->subject_prof}\n";
        echo "Willis midterm: {$willisExam->midterm_exam}, final: {$willisExam->final_exam}\n";
    }
}