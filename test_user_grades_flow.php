<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TESTING USER GRADES FUNCTIONALITY ===\n\n";

// 1. Check if user_grades table exists and has data
echo "1. Checking user_grades table...\n";
try {
    $userGradesCount = DB::table('user_grades')->count();
    echo "   ✓ user_grades table exists with $userGradesCount records\n";
    
    // Show sample data
    $sampleGrades = DB::table('user_grades')->limit(3)->get();
    echo "   Sample records:\n";
    foreach ($sampleGrades as $grade) {
        echo "     User {$grade->user_id}: {$grade->semester} - Grade: {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error with user_grades table: " . $e->getMessage() . "\n";
}

echo "\n2. Testing API endpoint for specific user...\n";

// Find a test user (Willis)
$willis = DB::table('users')->where('first_name', 'Willis')->first();
if ($willis) {
    echo "   Testing with Willis (ID: {$willis->id})\n";
    
    // Check if Willis has posted grades
    $willisGrades = DB::table('user_grades')->where('user_id', $willis->id)->get();
    echo "   Willis has " . count($willisGrades) . " posted grades:\n";
    foreach ($willisGrades as $grade) {
        echo "     {$grade->semester}: Grade {$grade->equivalent_grade}, Final: {$grade->final_grade}, Remarks: {$grade->remarks}\n";
    }
    
    // Test the API endpoint manually
    echo "\n   Simulating API call to getUserGrades for Willis...\n";
    
    // Get user basic info
    $userInfo = DB::table('users')->where('id', $willis->id)
                       ->select(
                           'id',
                           'first_name',
                           'last_name',
                           'middle_name',
                           'email',
                           'student_number',
                           'year',
                           'course',
                           'section'
                       )
                       ->first();
        
    // Get posted grades for both semesters
    $firstSemesterGrades = DB::table('user_grades')
        ->where('user_id', $willis->id)
        ->where('semester', '2025-2026 1st semester')
        ->first();
        
    $secondSemesterGrades = DB::table('user_grades')
        ->where('user_id', $willis->id)
        ->where('semester', '2025-2026 2nd semester')
        ->first();
    
    // Prepare response with both semesters
    $response = [
        'id' => $userInfo->id,
        'first_name' => $userInfo->first_name,
        'last_name' => $userInfo->last_name,
        'middle_name' => $userInfo->middle_name,
        'email' => $userInfo->email,
        'student_number' => $userInfo->student_number,
        'year' => $userInfo->year,
        'course' => $userInfo->course,
        'section' => $userInfo->section,
        'first_semester' => [
            'equivalent_grade' => $firstSemesterGrades ? $firstSemesterGrades->equivalent_grade : null,
            'remarks' => $firstSemesterGrades ? $firstSemesterGrades->remarks : null,
            'final_grade' => $firstSemesterGrades ? $firstSemesterGrades->final_grade : null
        ],
        'second_semester' => [
            'equivalent_grade' => $secondSemesterGrades ? $secondSemesterGrades->equivalent_grade : null,
            'remarks' => $secondSemesterGrades ? $secondSemesterGrades->remarks : null,
            'final_grade' => $secondSemesterGrades ? $secondSemesterGrades->final_grade : null
        ]
    ];
    
    echo "   API Response:\n";
    echo "     First Semester: Grade=" . ($response['first_semester']['equivalent_grade'] ?: 'null') . 
         ", Remarks=" . ($response['first_semester']['remarks'] ?: 'null') . "\n";
    echo "     Second Semester: Grade=" . ($response['second_semester']['equivalent_grade'] ?: 'null') . 
         ", Remarks=" . ($response['second_semester']['remarks'] ?: 'null') . "\n";
}

echo "\n3. Testing Post Grades functionality...\n";

// Simulate posting a grade for Willis
if ($willis) {
    try {
        // Test data to post
        $testGradeData = [
            'user_id' => $willis->id,
            'equivalent_grade' => 2.75,
            'remarks' => 'Passed',
            'final_grade' => 77
        ];
        
        $semester = '2025-2026 2nd semester';
        
        echo "   Posting test grade for Willis in 2nd semester...\n";
        
        // Simulate the postGrades logic
        DB::table('user_grades')->updateOrInsert(
            [
                'user_id' => $testGradeData['user_id'],
                'semester' => $semester
            ],
            [
                'equivalent_grade' => $testGradeData['equivalent_grade'],
                'remarks' => $testGradeData['remarks'],
                'final_grade' => $testGradeData['final_grade'],
                'updated_at' => now(),
                'created_at' => now()
            ]
        );
        
        echo "   ✓ Grade posted successfully\n";
        
        // Verify it was saved
        $postedGrade = DB::table('user_grades')
            ->where('user_id', $willis->id)
            ->where('semester', $semester)
            ->first();
            
        if ($postedGrade) {
            echo "   ✓ Verification: Grade {$postedGrade->equivalent_grade}, Remarks: {$postedGrade->remarks}, Final: {$postedGrade->final_grade}\n";
        }
        
    } catch (Exception $e) {
        echo "   ✗ Error posting grade: " . $e->getMessage() . "\n";
    }
}

echo "\n4. Testing User Grades API endpoint...\n";

// Test the actual API endpoint
try {
    $response = file_get_contents("http://localhost:8000/api/user/grades", false, stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]));
    
    if ($response) {
        echo "   ✓ API endpoint accessible\n";
        $data = json_decode($response, true);
        if ($data && isset($data['first_semester'])) {
            echo "   ✓ API returned valid data structure\n";
        }
    }
} catch (Exception $e) {
    echo "   ⚠ Could not test live API endpoint (may need authentication): " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";