<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== UPDATING EXISTING GRADES TO USE PASSED/FAILED REMARKS ===\n\n";

// Get all existing grades
$existingGrades = DB::table('user_grades')->get();

echo "Found " . count($existingGrades) . " existing posted grades\n\n";

foreach ($existingGrades as $grade) {
    $user = DB::table('users')->where('id', $grade->user_id)->first();
    $userName = $user ? "{$user->first_name} {$user->last_name}" : "User {$grade->user_id}";
    
    echo "Processing: $userName - {$grade->semester}\n";
    echo "  Current: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
    
    // Determine correct remarks based on equivalent grade
    $eq = (float) $grade->equivalent_grade;
    $newRemarks = ($eq < 4.0) ? 'Passed' : 'Failed';
    
    echo "  New: Grade {$grade->equivalent_grade}, Remarks: $newRemarks\n";
    
    // Update the grade
    DB::table('user_grades')
        ->where('id', $grade->id)
        ->update(['remarks' => $newRemarks]);
    
    echo "  ✓ Updated\n\n";
}

echo "=== UPDATE COMPLETE ===\n\n";

// Verify the updates
echo "Verification - All grades now have correct remarks:\n";
$updatedGrades = DB::table('user_grades')
    ->join('users', 'user_grades.user_id', '=', 'users.id')
    ->select('users.first_name', 'users.last_name', 'user_grades.semester', 
             'user_grades.equivalent_grade', 'user_grades.remarks')
    ->orderBy('users.first_name')
    ->get();

foreach ($updatedGrades as $grade) {
    echo "  {$grade->first_name} {$grade->last_name} - {$grade->semester}: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
}