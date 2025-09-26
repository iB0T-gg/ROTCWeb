<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Rounding off subject_prof values in second_semester_exam_scores table...\n\n";

// Get all records with non-zero subject_prof values
$records = DB::table('second_semester_exam_scores')
    ->whereNotNull('subject_prof')
    ->where('subject_prof', '>', 0)
    ->get();

echo "Found " . $records->count() . " records with subject_prof values to round:\n\n";

$updatedCount = 0;
foreach ($records as $record) {
    $oldValue = $record->subject_prof;
    $newValue = round($oldValue);
    
    echo "User ID {$record->user_id}: {$oldValue} → {$newValue}\n";
    
    // Update the record
    DB::table('second_semester_exam_scores')
        ->where('id', $record->id)
        ->update(['subject_prof' => $newValue]);
    
    $updatedCount++;
}

echo "\n✅ Successfully rounded {$updatedCount} subject_prof values!\n\n";

// Show all current subject_prof values
echo "Current subject_prof values in database:\n";
$allRecords = DB::table('second_semester_exam_scores')
    ->whereNotNull('subject_prof')
    ->orderBy('user_id')
    ->get();

echo "User ID | Subject Prof\n";
echo "--------|------------\n";
foreach ($allRecords as $record) {
    echo "{$record->user_id} | {$record->subject_prof}\n";
}

echo "\nDone!\n";
