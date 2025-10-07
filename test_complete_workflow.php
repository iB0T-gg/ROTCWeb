<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

echo "=== TESTING COMPLETE GRADE POSTING WORKFLOW ===\n\n";

// Get Willis's data
$willis = DB::table('users')->where('first_name', 'Willis')->first();
if (!$willis) {
    echo "Willis not found!\n";
    exit;
}

echo "Testing with Willis Aufderhar (ID: {$willis->id})\n\n";

// 1. First, let's see Willis's current calculated grades
echo "1. Getting Willis's calculated final grades...\n";

$controller = new FinalGradesController();
$request = new Request();
$request->merge(['semester' => '2025-2026 2nd semester']);

// Get the final grades data
try {
    $response = $controller->getFinalGrades($request);
    $finalGradesData = json_decode($response->getContent(), true);
    
    $willisData = null;
    foreach ($finalGradesData as $student) {
        if ($student['id'] == $willis->id) {
            $willisData = $student;
            break;
        }
    }
    
    if ($willisData) {
        echo "   Willis's calculated grades:\n";
        echo "   - Aptitude: {$willisData['aptitude_percentage']}%\n";
        echo "   - Attendance: {$willisData['attendance_percentage']}%\n";
        echo "   - Exam: {$willisData['exam_percentage']}%\n";
        echo "   - Final Grade: {$willisData['final_grade']}\n";
        echo "   - Equivalent Grade: {$willisData['equivalent_grade']}\n";
        echo "   - Remarks: {$willisData['remarks']}\n";
    } else {
        echo "   ✗ Willis not found in final grades data\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error getting final grades: " . $e->getMessage() . "\n";
}

echo "\n2. Posting Willis's grades...\n";

// Simulate posting Willis's grade
$postData = [
    [
        'user_id' => $willis->id,
        'equivalent_grade' => $willisData ? $willisData['equivalent_grade'] : 1.00,
        'remarks' => $willisData ? $willisData['remarks'] : 'Excellent',
        'final_grade' => $willisData ? $willisData['final_grade'] : 95
    ]
];

$postRequest = new Request();
$postRequest->merge([
    'semester' => '2025-2026 2nd semester',
    'grades' => $postData
]);

try {
    $postResponse = $controller->postGrades($postRequest);
    $postResult = json_decode($postResponse->getContent(), true);
    
    if (isset($postResult['message']) && strpos($postResult['message'], 'successfully') !== false) {
        echo "   ✓ Grades posted successfully\n";
    } else {
        echo "   ⚠ Post response: " . $postResponse->getContent() . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error posting grades: " . $e->getMessage() . "\n";
}

echo "\n3. Verifying grades were saved in user_grades table...\n";

$savedGrade = DB::table('user_grades')
    ->where('user_id', $willis->id)
    ->where('semester', '2025-2026 2nd semester')
    ->first();

if ($savedGrade) {
    echo "   ✓ Grade found in database:\n";
    echo "   - User ID: {$savedGrade->user_id}\n";
    echo "   - Semester: {$savedGrade->semester}\n";
    echo "   - Equivalent Grade: {$savedGrade->equivalent_grade}\n";
    echo "   - Remarks: {$savedGrade->remarks}\n";
    echo "   - Final Grade: {$savedGrade->final_grade}\n";
} else {
    echo "   ✗ No grade found in database\n";
}

echo "\n4. Testing UserController getUserGrades...\n";

$userController = new UserController();

// Create a mock authenticated request for Willis
$userRequest = new Request();
// Simulate authenticated user
$willis_user = \App\Models\User::find($willis->id);

try {
    // We'll need to simulate the auth user
    auth()->login($willis_user);
    
    $userResponse = $userController->getUserGrades($userRequest);
    $userData = json_decode($userResponse->getContent(), true);
    
    echo "   User grades response:\n";
    echo "   - First Semester: Grade=" . ($userData['first_semester']['equivalent_grade'] ?? 'null') . 
         ", Remarks=" . ($userData['first_semester']['remarks'] ?? 'null') . "\n";
    echo "   - Second Semester: Grade=" . ($userData['second_semester']['equivalent_grade'] ?? 'null') . 
         ", Remarks=" . ($userData['second_semester']['remarks'] ?? 'null') . "\n";
    
    if ($userData['second_semester']['equivalent_grade']) {
        echo "   ✓ Willis can see his posted 2nd semester grade!\n";
    } else {
        echo "   ✗ Willis cannot see his 2nd semester grade\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ Error getting user grades: " . $e->getMessage() . "\n";
}

echo "\n5. Testing with 1st semester as well...\n";

// Post a grade for 1st semester too
$firstSemPostData = [
    [
        'user_id' => $willis->id,
        'equivalent_grade' => 1.00,
        'remarks' => 'Excellent',
        'final_grade' => 100
    ]
];

$firstSemRequest = new Request();
$firstSemRequest->merge([
    'semester' => '2025-2026 1st semester',
    'grades' => $firstSemPostData
]);

try {
    $firstSemResponse = $controller->postGrades($firstSemRequest);
    echo "   ✓ 1st semester grade posted\n";
    
    // Get updated user grades
    $finalUserResponse = $userController->getUserGrades($userRequest);
    $finalUserData = json_decode($finalUserResponse->getContent(), true);
    
    echo "   Final user grades:\n";
    echo "   - First Semester: Grade=" . ($finalUserData['first_semester']['equivalent_grade'] ?? 'null') . 
         ", Remarks=" . ($finalUserData['first_semester']['remarks'] ?? 'null') . "\n";
    echo "   - Second Semester: Grade=" . ($finalUserData['second_semester']['equivalent_grade'] ?? 'null') . 
         ", Remarks=" . ($finalUserData['second_semester']['remarks'] ?? 'null') . "\n";
    
} catch (Exception $e) {
    echo "   ✗ Error with 1st semester: " . $e->getMessage() . "\n";
}

echo "\n=== WORKFLOW TEST COMPLETE ===\n";