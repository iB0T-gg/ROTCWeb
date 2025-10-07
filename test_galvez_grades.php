<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

echo "=== TESTING GRADE POSTING FOR GALVEZ ===\n\n";

// Use the first Galvez user (ID: 14)
$galvez = DB::table('users')->where('id', 14)->first();
echo "Testing with: {$galvez->first_name} {$galvez->last_name} (ID: {$galvez->id})\n";
echo "Email: {$galvez->email}\n\n";

echo "1. Posting test grades for Galvez...\n";

$controller = new FinalGradesController();

// Post first semester grade
$firstSemGradeData = [
    [
        'user_id' => $galvez->id,
        'equivalent_grade' => 2.00,
        'remarks' => 'Good',
        'final_grade' => 85
    ]
];

$firstSemRequest = new Request();
$firstSemRequest->merge([
    'semester' => '2025-2026 1st semester',
    'grades' => $firstSemGradeData
]);

try {
    $response = $controller->postGrades($firstSemRequest);
    echo "   ✓ First semester grade posted\n";
} catch (Exception $e) {
    echo "   ✗ Error posting first semester: " . $e->getMessage() . "\n";
}

// Post second semester grade
$secondSemGradeData = [
    [
        'user_id' => $galvez->id,
        'equivalent_grade' => 1.75,
        'remarks' => 'Very Good',
        'final_grade' => 90
    ]
];

$secondSemRequest = new Request();
$secondSemRequest->merge([
    'semester' => '2025-2026 2nd semester',
    'grades' => $secondSemGradeData
]);

try {
    $response = $controller->postGrades($secondSemRequest);
    echo "   ✓ Second semester grade posted\n";
} catch (Exception $e) {
    echo "   ✗ Error posting second semester: " . $e->getMessage() . "\n";
}

echo "\n2. Verifying grades were saved in database...\n";

$savedGrades = DB::table('user_grades')->where('user_id', $galvez->id)->get();
foreach ($savedGrades as $grade) {
    echo "   ✓ {$grade->semester}: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}, Final: {$grade->final_grade}\n";
}

echo "\n3. Testing getUserGrades API for Galvez...\n";

$userController = new UserController();
$request = new Request();

// Mock authentication for Galvez
$galvezUser = \App\Models\User::find($galvez->id);
auth()->login($galvezUser);

try {
    $response = $userController->getUserGrades($request);
    $userData = json_decode($response->getContent(), true);
    
    echo "   User info: {$userData['first_name']} {$userData['last_name']}\n";
    echo "   Email: {$userData['email']}\n";
    echo "   First Semester:\n";
    echo "     Grade: " . ($userData['first_semester']['equivalent_grade'] ?? 'null') . "\n";
    echo "     Remarks: " . ($userData['first_semester']['remarks'] ?? 'null') . "\n";
    echo "     Final: " . ($userData['first_semester']['final_grade'] ?? 'null') . "\n";
    echo "   Second Semester:\n";
    echo "     Grade: " . ($userData['second_semester']['equivalent_grade'] ?? 'null') . "\n";
    echo "     Remarks: " . ($userData['second_semester']['remarks'] ?? 'null') . "\n";
    echo "     Final: " . ($userData['second_semester']['final_grade'] ?? 'null') . "\n";
    
    if ($userData['first_semester']['equivalent_grade'] && $userData['second_semester']['equivalent_grade']) {
        echo "\n   ✅ SUCCESS: Galvez now has both semester grades!\n";
        echo "   The user interface should now show:\n";
        echo "   - Military Science 1 (NSTP101): Grade {$userData['first_semester']['equivalent_grade']}, Remarks: {$userData['first_semester']['remarks']}\n";
        echo "   - Military Science 2 (NSTP102): Grade {$userData['second_semester']['equivalent_grade']}, Remarks: {$userData['second_semester']['remarks']}\n";
    } else {
        echo "\n   ⚠ Some grades are still missing\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ Error getting user grades: " . $e->getMessage() . "\n";
}

echo "\n4. Summary:\n";
$totalGrades = DB::table('user_grades')->count();
echo "   Total grades in system: $totalGrades\n";
echo "   Galvez now has posted grades and should see them in the user interface\n";
echo "   The '-' values will be replaced with actual grades and remarks\n";

echo "\n=== TEST COMPLETE ===\n";