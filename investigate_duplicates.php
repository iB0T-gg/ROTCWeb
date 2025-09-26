<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Investigating duplicates in second_semester_aptitude table...\n\n";

// Get all records
$records = DB::table('second_semester_aptitude')->get();

echo "Total records: " . $records->count() . "\n\n";

// Group by cadet_id to find duplicates
$groupedByCadetId = $records->groupBy('cadet_id');

echo "Records grouped by cadet_id:\n";
echo "Cadet ID | Count | Record IDs\n";
echo "---------|-------|----------\n";

$duplicates = [];
foreach ($groupedByCadetId as $cadetId => $cadetRecords) {
    $count = $cadetRecords->count();
    $recordIds = $cadetRecords->pluck('id')->toArray();
    echo sprintf("%-8s | %-5s | %s\n", $cadetId, $count, implode(', ', $recordIds));
    
    if ($count > 1) {
        $duplicates[$cadetId] = $cadetRecords;
    }
}

echo "\nDuplicate cadet_ids found: " . count($duplicates) . "\n\n";

if (count($duplicates) > 0) {
    echo "Detailed duplicate information:\n";
    echo "==============================\n";
    
    foreach ($duplicates as $cadetId => $records) {
        echo "\nCadet ID: $cadetId (has " . $records->count() . " records)\n";
        foreach ($records as $record) {
            echo "  ID: {$record->id}, Type: {$record->type}, Semester: {$record->semester}\n";
        }
    }
}

echo "\nDone!\n";
