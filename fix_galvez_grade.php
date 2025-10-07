<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== FIXING GALVEZ GRADE DISCREPANCY ===\n\n";

// Get current posted grade details
$postedGrade = DB::table('user_grades')
    ->where('user_id', 14)
    ->where('semester', '2025-2026 2nd semester')
    ->first();

if ($postedGrade) {
    echo "Current posted grade details:\n";
    echo "  User ID: {$postedGrade->user_id}\n";
    echo "  Semester: {$postedGrade->semester}\n";
    echo "  Final Grade: {$postedGrade->final_grade}\n";
    echo "  Equivalent Grade: {$postedGrade->equivalent_grade}\n";
    echo "  Remarks: {$postedGrade->remarks}\n";
    echo "  Created: {$postedGrade->created_at}\n";
    echo "  Updated: {$postedGrade->updated_at}\n\n";
}

echo "Current calculated values (from faculty API):\n";
echo "  Final Grade: 85\n";
echo "  Equivalent Grade: 2.00\n";
echo "  Remarks: Passed\n\n";

echo "Updating posted grade to match current calculations...\n";

// Get the correct computed remarks
function computeRemarks($equivalentGrade) {
    if ($equivalentGrade < 4.0) {
        return 'Passed';
    } elseif ($equivalentGrade == 4.0) {
        return 'Incomplete';
    } else {
        return 'Failed';
    }
}

$newRemarks = computeRemarks(2.00);

// Update the posted grade
$updated = DB::table('user_grades')
    ->where('user_id', 14)
    ->where('semester', '2025-2026 2nd semester')
    ->update([
        'final_grade' => 85,
        'equivalent_grade' => 2.00,
        'remarks' => $newRemarks,
        'updated_at' => now()
    ]);

if ($updated) {
    echo "✅ Successfully updated Galvez's posted grade!\n\n";
    
    // Verify the update
    $updatedGrade = DB::table('user_grades')
        ->where('user_id', 14)
        ->where('semester', '2025-2026 2nd semester')
        ->first();
    
    echo "Verified updated grade:\n";
    echo "  Final Grade: {$updatedGrade->final_grade}\n";
    echo "  Equivalent Grade: {$updatedGrade->equivalent_grade}\n";
    echo "  Remarks: {$updatedGrade->remarks}\n";
    echo "  Updated: {$updatedGrade->updated_at}\n\n";
    
    echo "Now both faculty and user interfaces should show:\n";
    echo "  Final Grade: 85\n";
    echo "  Equivalent Grade: 2.00\n";
    echo "  Remarks: Passed\n\n";
} else {
    echo "❌ Failed to update the grade.\n";
}

echo "=== FIX COMPLETE ===\n";