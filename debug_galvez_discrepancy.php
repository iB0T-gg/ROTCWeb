<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

echo "=== DEBUGGING GALVEZ GRADE DISCREPANCY ===\n\n";

// Find all Galvez users
$galvezUsers = DB::table('users')
    ->where('first_name', 'like', '%Jewell%')
    ->orWhere('last_name', 'like', '%Galvez%')
    ->get();

echo "Found " . count($galvezUsers) . " Galvez users:\n";
foreach ($galvezUsers as $user) {
    echo "  ID {$user->id}: {$user->first_name} {$user->last_name} ({$user->email})\n";
}

echo "\n1. Checking posted grades in user_grades table:\n";
echo "=" . str_repeat("=", 50) . "\n";

foreach ($galvezUsers as $user) {
    echo "\nUser ID {$user->id} ({$user->first_name} {$user->last_name}):\n";
    
    $postedGrades = DB::table('user_grades')->where('user_id', $user->id)->get();
    
    if ($postedGrades->count() > 0) {
        foreach ($postedGrades as $grade) {
            echo "  Posted: {$grade->semester} - Grade: {$grade->equivalent_grade}, Final: {$grade->final_grade}, Remarks: {$grade->remarks}\n";
        }
    } else {
        echo "  No posted grades found\n";
    }
}

echo "\n2. Checking what Faculty Final Grades API returns:\n";
echo "=" . str_repeat("=", 50) . "\n";

$controller = new FinalGradesController();

foreach (['2025-2026 1st semester', '2025-2026 2nd semester'] as $semester) {
    echo "\n$semester:\n";
    
    $request = new Request();
    $request->merge(['semester' => $semester]);
    
    try {
        $response = $controller->getFinalGrades($request);
        $gradesData = json_decode($response->getContent(), true);
        
        foreach ($galvezUsers as $user) {
            $studentData = array_filter($gradesData, function($student) use ($user) {
                return $student['id'] == $user->id;
            });
            
            if (!empty($studentData)) {
                $student = array_values($studentData)[0];
                echo "  Faculty API - User {$user->id}: Final={$student['final_grade']}, Equiv={$student['equivalent_grade']}, Remarks={$student['remarks']}\n";
            } else {
                echo "  Faculty API - User {$user->id}: Not found in response\n";
            }
        }
        
    } catch (Exception $e) {
        echo "  Error: " . $e->getMessage() . "\n";
    }
}

echo "\n3. Checking what User Grades API returns:\n";
echo "=" . str_repeat("=", 50) . "\n";

$userController = new UserController();

foreach ($galvezUsers as $user) {
    echo "\nUser ID {$user->id} ({$user->first_name} {$user->last_name}):\n";
    
    try {
        // Mock authentication
        $userModel = \App\Models\User::find($user->id);
        auth()->login($userModel);
        
        $request = new Request();
        $response = $userController->getUserGrades($request);
        $userData = json_decode($response->getContent(), true);
        
        echo "  User API Response:\n";
        echo "    First Semester: Grade={$userData['first_semester']['equivalent_grade']}, Remarks={$userData['first_semester']['remarks']}\n";
        echo "    Second Semester: Grade={$userData['second_semester']['equivalent_grade']}, Remarks={$userData['second_semester']['remarks']}\n";
        
    } catch (Exception $e) {
        echo "  Error: " . $e->getMessage() . "\n";
    }
}

echo "\n4. Checking raw data sources for discrepancies:\n";
echo "=" . str_repeat("=", 50) . "\n";

// Check for the specific Galvez showing discrepancy (likely user ID 14)
$mainGalvez = DB::table('users')->where('id', 14)->first();
if ($mainGalvez) {
    echo "\nFocusing on main Galvez (ID 14):\n";
    
    // Check 2nd semester raw data
    echo "\n2nd semester raw data sources:\n";
    
    // Check aptitude
    $aptitude = DB::table('second_semester_aptitude')->where('cadet_id', 14)->where('semester', '2025-2026 2nd semester')->first();
    if ($aptitude) {
        echo "  Aptitude: aptitude_30 = {$aptitude->aptitude_30}\n";
    } else {
        echo "  Aptitude: No record found\n";
    }
    
    // Check attendance
    $attendance = DB::table('second_semester_attendance')->where('user_id', 14)->where('semester', '2025-2026 2nd semester')->first();
    if ($attendance) {
        echo "  Attendance: attendance_30 = {$attendance->attendance_30}\n";
    } else {
        echo "  Attendance: No record found\n";
    }
    
    // Check exam
    $exam = DB::table('second_semester_exam_scores')->where('user_id', 14)->where('semester', '2025-2026 2nd semester')->first();
    if ($exam) {
        echo "  Exam: midterm = {$exam->midterm_exam}, final = {$exam->final_exam}\n";
        
        // Calculate exam score manually
        $midterm = (float) ($exam->midterm_exam ?: 0);
        $final = (float) ($exam->final_exam ?: 0);
        $average = ($midterm + $final) / 2;
        $examScore = min(40, round($average * 0.40));
        echo "  Exam calculation: ({$midterm} + {$final}) / 2 = {$average}, exam score = {$examScore}\n";
    } else {
        echo "  Exam: No record found\n";
    }
    
    // Calculate total and equivalent grade
    $aptitudeScore = $aptitude ? (int) $aptitude->aptitude_30 : 0;
    $attendanceScore = $attendance ? (int) $attendance->attendance_30 : 0;
    $examScore = isset($examScore) ? $examScore : 0;
    
    $totalScore = $aptitudeScore + $attendanceScore + $examScore;
    
    echo "\n  Manual calculation:\n";
    echo "    Aptitude: {$aptitudeScore}\n";
    echo "    Attendance: {$attendanceScore}\n";
    echo "    Exam: {$examScore}\n";
    echo "    Total: {$totalScore}\n";
    
    // Calculate equivalent grade
    function computeEquivalentGrade($totalPercentage) {
        if ($totalPercentage >= 96.5) return 1.00;
        if ($totalPercentage >= 93.5) return 1.25;
        if ($totalPercentage >= 90.5) return 1.50;
        if ($totalPercentage >= 87.5) return 1.75;
        if ($totalPercentage >= 84.5) return 2.00;
        if ($totalPercentage >= 81.5) return 2.25;
        if ($totalPercentage >= 78.5) return 2.50;
        if ($totalPercentage >= 75.5) return 2.75;
        if ($totalPercentage >= 75.0) return 3.00;
        return 5.00;
    }
    
    $expectedEquiv = computeEquivalentGrade($totalScore);
    echo "    Expected Equivalent Grade: {$expectedEquiv}\n";
    
    // Compare with what's stored and what APIs return
    $postedGrade = DB::table('user_grades')->where('user_id', 14)->where('semester', '2025-2026 2nd semester')->first();
    if ($postedGrade) {
        echo "    Posted Grade: {$postedGrade->equivalent_grade}\n";
        echo "    Posted Final: {$postedGrade->final_grade}\n";
    }
}

echo "\n=== DEBUGGING COMPLETE ===\n";
