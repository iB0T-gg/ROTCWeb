<?php

require_once __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== VERIFYING SEMESTER API RESPONSE ===\n\n";

// Simulate what the getAvailableSemesters method does
echo "--- CHECKING getAvailableSemesters() API RESPONSE ---\n";

try {
    // Get semesters from users table
    $userSemesters = DB::table('users')
                        ->where('role', 'user')
                        ->where('archived', false)
                        ->whereNotNull('semester')
                        ->distinct()
                        ->pluck('semester')
                        ->filter();
    
    echo "Semesters from users table:\n";
    foreach ($userSemesters as $semester) {
        echo "  - $semester\n";
    }
    
    // Get semesters from second semester tables
    $secondSemesterSemesters = collect();
    try {
        $secondSemesterSemesters = DB::table('second_semester_aptitude')
                                    ->distinct()
                                    ->pluck('semester')
                                    ->filter();
    } catch (Exception $e) {
        echo "Error accessing second_semester_aptitude: " . $e->getMessage() . "\n";
    }
    
    echo "\nSemesters from second_semester_aptitude table:\n";
    foreach ($secondSemesterSemesters as $semester) {
        echo "  - $semester\n";
    }
    
    // Combine and sort semesters
    $allSemesters = $userSemesters->merge($secondSemesterSemesters)
                                ->unique()
                                ->sort()
                                ->values();
    
    echo "\nCombined and sorted semesters (what the API returns):\n";
    foreach ($allSemesters as $semester) {
        echo "  - $semester\n";
    }
    
    echo "\nFinal API response would be:\n";
    echo json_encode($allSemesters) . "\n";
    
    // Check if there are any 2026-2027 references
    $hasOldSemester = $allSemesters->contains('2026-2027 2nd semester');
    if ($hasOldSemester) {
        echo "\n❌ PROBLEM FOUND: API is still returning '2026-2027 2nd semester'\n";
        echo "You need to run the database update script to fix this.\n";
    } else {
        echo "\n✅ GOOD: API is returning correct semester names\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== VERIFICATION COMPLETE ===\n";
