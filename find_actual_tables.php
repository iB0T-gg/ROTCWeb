<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

echo "=== FINDING ACTUAL TABLE NAMES ===\n\n";

// Get all table names
$tableNames = [];
try {
    $tables = Schema::getAllTables();
    foreach ($tables as $table) {
        $tableNames[] = $table->getName();
    }
} catch (Exception $e) {
    echo "Error getting table names: " . $e->getMessage() . "\n";
    exit;
}

echo "All tables in database:\n";
foreach ($tableNames as $table) {
    echo "- $table\n";
}

echo "\n=== FOCUSED TABLE ANALYSIS ===\n\n";

// Find semester-related tables
$semesterTables = array_filter($tableNames, function($table) {
    return stripos($table, 'semester') !== false || stripos($table, 'attendance') !== false || stripos($table, 'exam') !== false || stripos($table, 'merit') !== false || stripos($table, 'aptitude') !== false;
});

echo "Semester-related tables:\n";
foreach ($semesterTables as $table) {
    echo "- $table\n";
}

echo "\nNow I understand the issue!\n";
echo "Based on the available tables, let me identify the problem...\n";