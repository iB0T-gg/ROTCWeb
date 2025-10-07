<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FINDING ALL GALVEZ USERS AND THEIR DATA ===\n\n";

$semester = '2025-2026 2nd semester';

// Find all Galvez users
$galvezUsers = DB::table('users')
    ->where('first_name', 'LIKE', '%Galvez%')
    ->orWhere('last_name', 'LIKE', '%Galvez%')
    ->orWhere('first_name', 'LIKE', '%Toby%')
    ->orWhere('last_name', 'LIKE', '%Toby%')
    ->orWhere('first_name', 'LIKE', '%Jewell%')
    ->orWhere('last_name', 'LIKE', '%Jewell%')
    ->get();

echo "Found " . count($galvezUsers) . " Galvez/Toby/Jewell users:\n";
foreach ($galvezUsers as $user) {
    echo "\n--- USER: {$user->first_name} {$user->last_name} (ID: {$user->id}) ---\n";
    
    // Check exam records
    $examCount = DB::table('second_semester_exam_scores')
        ->where('user_id', $user->id)
        ->where('semester', $semester)
        ->count();
    echo "  Exam records: $examCount\n";
    
    if ($examCount > 0) {
        $exam = DB::table('second_semester_exam_scores')
            ->where('user_id', $user->id)
            ->where('semester', $semester)
            ->first();
        echo "    midterm: {$exam->midterm_exam}, final: {$exam->final_exam}, subject_prof: {$exam->subject_prof}\n";
        echo "    updated_at: {$exam->updated_at}\n";
    }
    
    // Check attendance records  
    $attendanceCount = DB::table('second_semester_attendance')
        ->where('user_id', $user->id)
        ->where('semester', $semester)
        ->count();
    echo "  Attendance records: $attendanceCount\n";
    
    // Check aptitude records
    $aptitudeCount = DB::table('second_semester_aptitude')
        ->where('cadet_id', $user->id)
        ->where('semester', $semester)
        ->count();
    echo "  Aptitude records: $aptitudeCount\n";
}

// Also check if there are any exam records with Galvez-like data
echo "\n=== CHECKING ALL EXAM RECORDS FOR CLUES ===\n";
$allExams = DB::table('second_semester_exam_scores')
    ->where('semester', $semester)
    ->orderBy('updated_at', 'desc')
    ->limit(10)
    ->get();

echo "Recent exam records:\n";
foreach ($allExams as $exam) {
    $user = DB::table('users')->where('id', $exam->user_id)->first();
    $userName = $user ? "{$user->first_name} {$user->last_name}" : "Unknown";
    echo "  User: $userName (ID: {$exam->user_id})\n";
    echo "    midterm: {$exam->midterm_exam}, final: {$exam->final_exam}, updated: {$exam->updated_at}\n";
}