<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== UPDATING GRADES WITH NEW REMARKS SYSTEM ===\n\n";
echo "New Logic:\n";
echo "- Grade < 4.0 = 'Passed'\n";
echo "- Grade = 4.0 = 'Incomplete'\n";
echo "- Grade > 4.0 = 'Failed'\n\n";

// Get all existing grades
$existingGrades = DB::table('user_grades')->get();

echo "Found " . count($existingGrades) . " existing posted grades\n\n";

foreach ($existingGrades as $grade) {
    $user = DB::table('users')->where('id', $grade->user_id)->first();
    $userName = $user ? "{$user->first_name} {$user->last_name}" : "User {$grade->user_id}";
    
    echo "Processing: $userName - {$grade->semester}\n";
    echo "  Current: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
    
    // Determine correct remarks based on new logic
    $eq = (float) $grade->equivalent_grade;
    if ($eq === 4.00) {
        $newRemarks = 'Incomplete';
    } elseif ($eq > 4.00) {
        $newRemarks = 'Failed';
    } else {
        $newRemarks = 'Passed';
    }
    
    echo "  New: Grade {$grade->equivalent_grade}, Remarks: $newRemarks\n";
    
    // Update the grade if remarks changed
    if ($grade->remarks !== $newRemarks) {
        DB::table('user_grades')
            ->where('id', $grade->id)
            ->update(['remarks' => $newRemarks]);
        echo "  ✓ Updated\n";
    } else {
        echo "  - No change needed\n";
    }
    echo "\n";
}

echo "=== UPDATE COMPLETE ===\n\n";

// Verify the updates and show summary
echo "Summary of all grades with new remarks:\n";
$updatedGrades = DB::table('user_grades')
    ->join('users', 'user_grades.user_id', '=', 'users.id')
    ->select('users.first_name', 'users.last_name', 'user_grades.semester', 
             'user_grades.equivalent_grade', 'user_grades.remarks')
    ->orderBy('user_grades.equivalent_grade')
    ->get();

$remarksCounts = ['Passed' => 0, 'Incomplete' => 0, 'Failed' => 0];

foreach ($updatedGrades as $grade) {
    echo "  {$grade->first_name} {$grade->last_name} - {$grade->semester}: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
    if (isset($remarksCounts[$grade->remarks])) {
        $remarksCounts[$grade->remarks]++;
    }
}

echo "\nGrades Distribution:\n";
echo "  Passed: {$remarksCounts['Passed']}\n";
echo "  Incomplete: {$remarksCounts['Incomplete']}\n";
echo "  Failed: {$remarksCounts['Failed']}\n";

echo "\nNew Remarks System Active! ✅\n";