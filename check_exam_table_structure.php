<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "First semester exam scores table structure:\n";
echo "==========================================\n";

$columns = DB::select('PRAGMA table_info(first_semester_exam_scores)');

foreach ($columns as $col) {
    echo $col->name . ' - ' . $col->type . ' (nullable: ' . ($col->notnull ? 'No' : 'Yes') . ")\n";
}

echo "\nSecond semester exam scores table structure:\n";
echo "============================================\n";

$columns2 = DB::select('PRAGMA table_info(second_semester_exam_scores)');

foreach ($columns2 as $col) {
    echo $col->name . ' - ' . $col->type . ' (nullable: ' . ($col->notnull ? 'No' : 'Yes') . ")\n";
}
