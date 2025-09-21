<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Updating merit records to use hyphens instead of 0 or null...\n";

try {
    // Function to update a specific table
    function updateMeritTable($tableName) {
        echo "Updating $tableName...\n";
        
        // Update all merit records where day scores are 0 or null to empty strings
        $updated = DB::table($tableName)
            ->where(function($query) {
                $query->where('day_1', 0)
                      ->orWhere('day_1', null)
                      ->orWhere('day_2', 0)
                      ->orWhere('day_2', null)
                      ->orWhere('day_3', 0)
                      ->orWhere('day_3', null)
                      ->orWhere('day_4', 0)
                      ->orWhere('day_4', null)
                      ->orWhere('day_5', 0)
                      ->orWhere('day_5', null)
                      ->orWhere('day_6', 0)
                      ->orWhere('day_6', null)
                      ->orWhere('day_7', 0)
                      ->orWhere('day_7', null)
                      ->orWhere('day_8', 0)
                      ->orWhere('day_8', null)
                      ->orWhere('day_9', 0)
                      ->orWhere('day_9', null)
                      ->orWhere('day_10', 0)
                      ->orWhere('day_10', null)
                      ->orWhere('day_11', 0)
                      ->orWhere('day_11', null)
                      ->orWhere('day_12', 0)
                      ->orWhere('day_12', null)
                      ->orWhere('day_13', 0)
                      ->orWhere('day_13', null)
                      ->orWhere('day_14', 0)
                      ->orWhere('day_14', null)
                      ->orWhere('day_15', 0)
                      ->orWhere('day_15', null);
            })
            ->update([
                'day_1' => DB::raw("CASE WHEN day_1 = 0 OR day_1 IS NULL THEN '' ELSE day_1 END"),
                'day_2' => DB::raw("CASE WHEN day_2 = 0 OR day_2 IS NULL THEN '' ELSE day_2 END"),
                'day_3' => DB::raw("CASE WHEN day_3 = 0 OR day_3 IS NULL THEN '' ELSE day_3 END"),
                'day_4' => DB::raw("CASE WHEN day_4 = 0 OR day_4 IS NULL THEN '' ELSE day_4 END"),
                'day_5' => DB::raw("CASE WHEN day_5 = 0 OR day_5 IS NULL THEN '' ELSE day_5 END"),
                'day_6' => DB::raw("CASE WHEN day_6 = 0 OR day_6 IS NULL THEN '' ELSE day_6 END"),
                'day_7' => DB::raw("CASE WHEN day_7 = 0 OR day_7 IS NULL THEN '' ELSE day_7 END"),
                'day_8' => DB::raw("CASE WHEN day_8 = 0 OR day_8 IS NULL THEN '' ELSE day_8 END"),
                'day_9' => DB::raw("CASE WHEN day_9 = 0 OR day_9 IS NULL THEN '' ELSE day_9 END"),
                'day_10' => DB::raw("CASE WHEN day_10 = 0 OR day_10 IS NULL THEN '' ELSE day_10 END"),
                'day_11' => DB::raw("CASE WHEN day_11 = 0 OR day_11 IS NULL THEN '' ELSE day_11 END"),
                'day_12' => DB::raw("CASE WHEN day_12 = 0 OR day_12 IS NULL THEN '' ELSE day_12 END"),
                'day_13' => DB::raw("CASE WHEN day_13 = 0 OR day_13 IS NULL THEN '' ELSE day_13 END"),
                'day_14' => DB::raw("CASE WHEN day_14 = 0 OR day_14 IS NULL THEN '' ELSE day_14 END"),
                'day_15' => DB::raw("CASE WHEN day_15 = 0 OR day_15 IS NULL THEN '' ELSE day_15 END"),
            ]);

        echo "Updated $updated records in $tableName.\n";
        
        // Also update the days_array JSON field
        $merits = DB::table($tableName)->get();
        foreach ($merits as $merit) {
            $days = [
                $merit->day_1, $merit->day_2, $merit->day_3, $merit->day_4, $merit->day_5,
                $merit->day_6, $merit->day_7, $merit->day_8, $merit->day_9, $merit->day_10,
                $merit->day_11, $merit->day_12, $merit->day_13, $merit->day_14, $merit->day_15
            ];
            
            DB::table($tableName)
                ->where('id', $merit->id)
                ->update(['days_array' => json_encode($days)]);
        }
        
        echo "Updated days_array for all records in $tableName.\n";
        
        return $updated;
    }
    
    // Update both tables
    $totalUpdated = 0;
    
    // Update first semester merits table
    $firstSemesterUpdated = updateMeritTable('first_semester_aptitude');
    $totalUpdated += $firstSemesterUpdated;
    
    // Update second semester merits table
    $secondSemesterUpdated = updateMeritTable('second_semester_aptitude');
    $totalUpdated += $secondSemesterUpdated;
    
    echo "\nTotal updated: $totalUpdated merit records across both tables.\n";
    echo "Update completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

/*
USAGE INSTRUCTIONS:
===================

This script updates existing merit records in BOTH semester tables to use empty strings ('') 
instead of 0 or null values, which will then display as hyphens (-) in the frontend.

To run this script:
1. Open terminal/command prompt
2. Navigate to your Laravel project directory
3. Run: php database_update_script.php

WHAT IT DOES:
- Converts all merit day scores from 0 or null to empty strings in BOTH tables:
 * first_semester_aptitude (First Semester data)
 * second_semester_aptitude (Second Semester data)
- Updates the days_array JSON field to match in both tables
- Ensures consistent display of hyphens (-) for unentered scores

TABLES UPDATED:
1. first_semester_aptitude - Contains merit scores for "2025-2026 1st semester"
2. second_semester_aptitude - Contains merit scores for "2026-2027 2nd semester"

CHANGES MADE TO THE CODEBASE:
1. SecondSemesterDataSeeder.php - Now sets empty strings instead of null
2. Merit.php Model - getDaysArrayAttribute() returns hyphens for empty values
3. SecondSemesterMerit.php Model - Same functionality as Merit model
4. facultyMerits.jsx - Properly handles hyphens in input display
5. adminMasterlist.jsx - Shows hyphens instead of N/A for empty grades
6. UserController.php - Uses correct model based on semester

This ensures all merit scores display consistently as hyphens (-) when not entered by faculty,
regardless of which semester you're working with.
*/
