<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FIXING HOSTED SITE SEMESTER ISSUE ===\n\n";

$oldSemester = '2026-2027 2nd semester';
$newSemester = '2025-2026 2nd semester';

echo "This script will update all database records from '$oldSemester' to '$newSemester'\n";
echo "This will fix the semester display issue on the hosted site.\n\n";

// List of tables to check and update
$tables = [
    'second_semester_aptitude',
    'second_semester_attendance', 
    'second_semester_exam_scores',
    'second_semester_merits',
    'users' // Also check users table
];

$totalUpdated = 0;

foreach ($tables as $table) {
    echo "--- CHECKING TABLE: $table ---\n";
    
    try {
        // Check if table exists
        $exists = DB::select("SHOW TABLES LIKE '$table'");
        if (empty($exists)) {
            echo "Table $table does not exist, skipping...\n\n";
            continue;
        }
        
        // Count records with old semester
        $count = DB::table($table)->where('semester', $oldSemester)->count();
        echo "Records with old semester '$oldSemester': $count\n";
        
        if ($count > 0) {
            // Update the records
            $updated = DB::table($table)
                ->where('semester', $oldSemester)
                ->update(['semester' => $newSemester]);
            
            echo "✅ Updated $updated records to '$newSemester'\n";
            $totalUpdated += $updated;
            
            // Verify the update
            $remaining = DB::table($table)->where('semester', $oldSemester)->count();
            echo "Remaining records with old semester: $remaining\n";
        } else {
            echo "No records found with old semester '$oldSemester'\n";
        }
        
        // Show current semesters in the table
        $currentSemesters = DB::table($table)->distinct()->pluck('semester');
        echo "Current semesters in $table:\n";
        foreach ($currentSemesters as $semester) {
            echo "  - $semester\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error processing table $table: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

echo "=== SUMMARY ===\n";
echo "Total records updated: $totalUpdated\n";
echo "All semester references should now be '2025-2026 2nd semester'\n";
echo "\n=== NEXT STEPS ===\n";
echo "1. Clear any application cache on the hosted site\n";
echo "2. Refresh the admin pages\n";
echo "3. The semester dropdowns should now show '2025-2026 2nd semester'\n";
echo "=== UPDATE COMPLETE ===\n";
