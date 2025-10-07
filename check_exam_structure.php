<?php

require_once __DIR__ . '/vendor/autoload.php';
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== CHECKING EXAM SCORES TABLE STRUCTURE ===\n\n";

$userId = 3;
$semester = '2025-2026 1st semester';

// Check exam scores table
$exam = DB::table('first_semester_exam_scores')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->first();

if ($exam) {
    echo "Exam record found for user $userId:\n";
    foreach ((array) $exam as $column => $value) {
        echo "  $column: " . ($value ?? 'NULL') . "\n";
    }
} else {
    echo "No exam record found for user $userId\n";
}

// Check a few other users too
$examRecords = DB::table('first_semester_exam_scores')
    ->where('semester', $semester)
    ->limit(3)
    ->get();

echo "\n=== SAMPLE EXAM RECORDS ===\n";
foreach ($examRecords as $record) {
    echo "User {$record->user_id}: ";
    $columns = [];
    foreach ((array) $record as $column => $value) {
        if ($column !== 'user_id' && $column !== 'semester' && $column !== 'id' && $column !== 'created_at' && $column !== 'updated_at') {
            $columns[] = "$column=" . ($value ?? 'NULL');
        }
    }
    echo implode(', ', $columns) . "\n";
}