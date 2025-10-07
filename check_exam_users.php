<?php

// Check database users and exam scores directly
require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\ExamScore;
use App\Models\SecondSemesterExamScore;

echo "=== Checking Users in Database ===\n";

// Get all users with role 'user' (cadets)
$users = User::where('role', 'user')->get();
echo "Total cadets found: " . $users->count() . "\n\n";

foreach ($users as $user) {
    echo "- {$user->last_name}, {$user->first_name} (ID: {$user->id})\n";
    echo "  Status: " . ($user->status ?? 'N/A') . "\n";
    echo "  Semester: " . ($user->semester ?? 'N/A') . "\n";
    echo "  Company: " . ($user->company ?? 'N/A') . "\n";
    
    // Check 1st semester exam scores
    $firstSemScore = ExamScore::where('user_id', $user->id)
        ->where('semester', '2025-2026 1st semester')
        ->first();
    echo "  1st Sem Exam: " . ($firstSemScore ? "Final={$firstSemScore->final_exam}" : "None") . "\n";
    
    // Check 2nd semester exam scores  
    $secondSemScore = SecondSemesterExamScore::where('user_id', $user->id)
        ->where('semester', '2025-2026 2nd semester')
        ->first();
    echo "  2nd Sem Exam: " . ($secondSemScore ? "Final={$secondSemScore->final_exam}, Mid={$secondSemScore->midterm_exam}" : "None") . "\n";
    echo "\n";
}

echo "\n=== Checking Second Semester Exam Scores Table ===\n";
$allSecondSemScores = SecondSemesterExamScore::where('semester', '2025-2026 2nd semester')->get();
echo "Total 2nd semester exam records: " . $allSecondSemScores->count() . "\n";

foreach ($allSecondSemScores as $score) {
    $user = User::find($score->user_id);
    echo "- User ID {$score->user_id}: " . ($user ? "{$user->last_name}, {$user->first_name}" : "User not found") . "\n";
    echo "  Final: {$score->final_exam}, Midterm: {$score->midterm_exam}\n";
}