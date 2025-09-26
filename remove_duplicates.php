<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Removing duplicate entries from second_semester_aptitude table...\n\n";

// Get all records
$records = DB::table('second_semester_aptitude')->get();

echo "Total records before cleanup: " . $records->count() . "\n\n";

// Group by cadet_id to find duplicates
$groupedByCadetId = $records->groupBy('cadet_id');

$duplicates = [];
foreach ($groupedByCadetId as $cadetId => $cadetRecords) {
    if ($cadetRecords->count() > 1) {
        $duplicates[$cadetId] = $cadetRecords;
    }
}

echo "Found " . count($duplicates) . " cadets with duplicate entries.\n\n";

$deletedCount = 0;

foreach ($duplicates as $cadetId => $records) {
    echo "Processing cadet_id: $cadetId\n";
    
    // Sort records by semester to keep the newer one (2026-2027)
    $sortedRecords = $records->sortBy('semester');
    
    // Keep the last record (newest semester) and delete the rest
    $recordsToDelete = $sortedRecords->slice(0, -1); // All except the last one
    
    foreach ($recordsToDelete as $recordToDelete) {
        echo "  Deleting record ID: {$recordToDelete->id} (semester: {$recordToDelete->semester})\n";
        DB::table('second_semester_aptitude')->where('id', $recordToDelete->id)->delete();
        $deletedCount++;
    }
    
    // Show which record was kept
    $keptRecord = $sortedRecords->last();
    echo "  Kept record ID: {$keptRecord->id} (semester: {$keptRecord->semester})\n\n";
}

echo "Cleanup completed!\n";
echo "Records deleted: $deletedCount\n";

// Verify the cleanup
$remainingRecords = DB::table('second_semester_aptitude')->get();
echo "Total records after cleanup: " . $remainingRecords->count() . "\n\n";

// Check for remaining duplicates
$remainingGrouped = $remainingRecords->groupBy('cadet_id');
$remainingDuplicates = 0;
foreach ($remainingGrouped as $cadetId => $cadetRecords) {
    if ($cadetRecords->count() > 1) {
        $remainingDuplicates++;
    }
}

echo "Remaining duplicates: $remainingDuplicates\n";

if ($remainingDuplicates === 0) {
    echo "✅ All duplicates have been successfully removed!\n";
} else {
    echo "⚠️  Some duplicates still remain.\n";
}

echo "\nDone!\n";
