<?php

// Let's check what the actual API returns when simulating the request
require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\ExamScore;
use App\Models\SecondSemesterExamScore;

echo "=== Simulating API Response for 2nd Semester ===\n";

$semester = '2025-2026 2nd semester';
$examScoreModel = SecondSemesterExamScore::class;

// Get all users with role 'user' (cadets) - same logic as controller
$users = User::where('role', 'user')->get();
$examData = [];

foreach ($users as $user) {
    // Get exam scores for this user and semester
    $examScore = $examScoreModel::where('user_id', $user->id)
        ->where('semester', $semester)
        ->first();
    
    $finalExam = $examScore ? $examScore->final_exam : '';
    $midtermExam = $examScore ? $examScore->midterm_exam : '';
    $subjectProf = $examScore ? $examScore->subject_prof : null;
    
    $examData[] = [
        'id' => $user->id,
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'middle_name' => $user->middle_name,
        'platoon' => $user->platoon ?? '',
        'company' => $user->company ?? '',
        'battalion' => $user->battalion ?? '',
        'final_exam' => $finalExam,
        'midterm_exam' => $midtermExam,
        'subject_prof' => $subjectProf,
    ];
}

echo "Total cadets in API response: " . count($examData) . "\n";
echo "Cadet list:\n";
foreach ($examData as $cadet) {
    $name = $cadet['last_name'] . ", " . $cadet['first_name'];
    $final = $cadet['final_exam'] === '' ? 'empty' : $cadet['final_exam'];
    $midterm = $cadet['midterm_exam'] === '' ? 'empty' : $cadet['midterm_exam'];
    echo "- {$name} (ID: {$cadet['id']}) - Final: {$final}, Midterm: {$midterm}\n";
}

echo "\n=== Looking for anyone named Galvez ===\n";
$galvezUsers = User::where('last_name', 'LIKE', '%galvez%')->orWhere('last_name', 'LIKE', '%Galvez%')->get();
echo "Users with 'Galvez' in last name: " . $galvezUsers->count() . "\n";
foreach ($galvezUsers as $user) {
    echo "- {$user->last_name}, {$user->first_name} (ID: {$user->id}, Role: {$user->role})\n";
}