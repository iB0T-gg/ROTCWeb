<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== DEBUGGING WILLIS 2ND SEMESTER EXAM ISSUE ===\n\n";

$semester = '2025-2026 2nd semester';
$willisId = 9; // Willis Aufderhar

echo "1. Checking Willis's current 2nd semester exam data...\n";

// Check Willis's exam data
$willisExam = DB::table('second_semester_exam_scores')
    ->where('user_id', $willisId)
    ->where('semester', $semester)
    ->first();

if ($willisExam) {
    echo "   ✓ Willis exam record found:\n";
    echo "     midterm_exam: {$willisExam->midterm_exam}\n";
    echo "     final_exam: {$willisExam->final_exam}\n";
    echo "     subject_prof: {$willisExam->subject_prof}\n";
    echo "     updated_at: {$willisExam->updated_at}\n\n";
    
    // Calculate what the exam score should be
    $midterm = (float) $willisExam->midterm_exam;
    $final = (float) $willisExam->final_exam;
    $average = ($midterm + $final) / 2;
    $examScore = min(40, round($average * 0.40));
    
    echo "   Manual calculation:\n";
    echo "     Average: ($midterm + $final) / 2 = $average\n";
    echo "     Exam Score: min(40, $average * 0.40) = $examScore\n\n";
    
    // If you want perfect score (40), what should the grades be?
    echo "   For perfect exam score (40 points):\n";
    echo "     Need average of 100 (since 100 * 0.40 = 40)\n";
    echo "     So midterm + final should total 200\n";
    echo "     Examples: midterm=100, final=100 OR midterm=95, final=105 etc.\n\n";
    
} else {
    echo "   ✗ No exam record found for Willis in 2nd semester\n";
    echo "   Let me check what exam records exist for Willis...\n";
    
    $allWillisExams = DB::table('second_semester_exam_scores')
        ->where('user_id', $willisId)
        ->get();
        
    echo "   Found " . count($allWillisExams) . " exam records for Willis:\n";
    foreach ($allWillisExams as $exam) {
        echo "     Semester: {$exam->semester}, Midterm: {$exam->midterm_exam}, Final: {$exam->final_exam}\n";
    }
}

echo "\n2. Testing current calculation method...\n";

$controller = new FinalGradesController();
$reflection = new ReflectionClass($controller);

$examMethod = $reflection->getMethod('calculateSecondSemesterExam');
$examMethod->setAccessible(true);
$currentExamScore = $examMethod->invoke($controller, $willisId, $semester);

echo "   Current calculated exam score: $currentExamScore\n\n";

echo "3. Let me update Willis's exam to perfect scores...\n";

if ($willisExam) {
    // Update to perfect scores
    DB::table('second_semester_exam_scores')
        ->where('user_id', $willisId)
        ->where('semester', $semester)
        ->update([
            'midterm_exam' => 100,
            'final_exam' => 100,
            'updated_at' => now()
        ]);
    echo "   ✓ Updated Willis's exam scores to midterm=100, final=100\n";
} else {
    // Create new perfect record
    DB::table('second_semester_exam_scores')->insert([
        'user_id' => $willisId,
        'midterm_exam' => 100,
        'final_exam' => 100,
        'average' => null,
        'subject_prof' => 0,
        'semester' => $semester,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "   ✓ Created new perfect exam record for Willis: midterm=100, final=100\n";
}

echo "\n4. Testing calculation with perfect scores...\n";

$newExamScore = $examMethod->invoke($controller, $willisId, $semester);
echo "   New calculated exam score: $newExamScore (should be 40)\n";

// Test full ROTC grade calculation
$aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
$aptitudeMethod->setAccessible(true);
$aptitude = $aptitudeMethod->invoke($controller, $willisId, $semester);

$attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
$attendanceMethod->setAccessible(true);
$attendance = $attendanceMethod->invoke($controller, $willisId, $semester);

$totalRotc = $aptitude + $attendance + $newExamScore;

echo "\n5. Willis's complete 2nd semester breakdown:\n";
echo "   Aptitude: $aptitude\n";
echo "   Attendance: $attendance\n";
echo "   Exam: $newExamScore\n";
echo "   TOTAL ROTC Grade: $totalRotc\n\n";

echo "6. Testing API response...\n";
$request = new Illuminate\Http\Request(['semester' => $semester]);
$response = $controller->getFinalGrades($request);

if ($response->getStatusCode() === 200) {
    $data = json_decode($response->getContent(), true);
    $willisData = collect($data)->firstWhere('id', $willisId);
    
    if ($willisData) {
        echo "   API Response for Willis:\n";
        echo "     ROTC Grade: {$willisData['rotc_grade']}\n";
        echo "     Final Grade: {$willisData['final_grade']}\n";
        echo "     Equivalent Grade: {$willisData['equivalent_grade']}\n";
        echo "     Remarks: {$willisData['remarks']}\n";
    } else {
        echo "   ✗ Willis not found in API response\n";
    }
} else {
    echo "   ✗ API Error: " . $response->getStatusCode() . "\n";
}

echo "\n=== DEBUGGING COMPLETE ===\n";