<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TESTING REAL-TIME 2ND SEMESTER CALCULATION ===\n\n";

$semester = '2025-2026 2nd semester';
$galvezId = 14; // Jewell Toby Galvez

// First, let's ensure Galvez has some test data in the correct semester
echo "1. Setting up test data for Galvez in 2nd semester...\n";

// Insert/Update exam record
$examExists = DB::table('second_semester_exam_scores')
    ->where('user_id', $galvezId)
    ->where('semester', $semester)
    ->exists();

if ($examExists) {
    DB::table('second_semester_exam_scores')
        ->where('user_id', $galvezId)
        ->where('semester', $semester)
        ->update([
            'midterm_exam' => 85,
            'final_exam' => 95,
            'updated_at' => now()
        ]);
    echo "   ✓ Updated existing exam record: midterm=85, final=95\n";
} else {
    DB::table('second_semester_exam_scores')->insert([
        'user_id' => $galvezId,
        'midterm_exam' => 85,
        'final_exam' => 95,
        'average' => null,
        'subject_prof' => 0,
        'semester' => $semester,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "   ✓ Created new exam record: midterm=85, final=95\n";
}

// Insert/Update attendance record
$attendanceExists = DB::table('second_semester_attendance')
    ->where('user_id', $galvezId)
    ->where('semester', $semester)
    ->exists();

if ($attendanceExists) {
    DB::table('second_semester_attendance')
        ->where('user_id', $galvezId)
        ->where('semester', $semester)
        ->update([
            'attendance_30' => 25,
            'weeks_present' => 12,
            'updated_at' => now()
        ]);
    echo "   ✓ Updated existing attendance record: attendance_30=25\n";
} else {
    DB::table('second_semester_attendance')->insert([
        'user_id' => $galvezId,
        'attendance_date' => now(),
        'semester' => $semester,
        'weeks_present' => 12,
        'attendance_30' => 25,
        'week_1' => 1, 'week_2' => 1, 'week_3' => 1, 'week_4' => 1, 'week_5' => 1,
        'week_6' => 1, 'week_7' => 1, 'week_8' => 1, 'week_9' => 1, 'week_10' => 1,
        'week_11' => 1, 'week_12' => 1, 'week_13' => 0, 'week_14' => 0, 'week_15' => 0,
        'average' => 0.8,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "   ✓ Created new attendance record: attendance_30=25\n";
}

// Insert/Update aptitude record
$aptitudeExists = DB::table('second_semester_aptitude')
    ->where('cadet_id', $galvezId)
    ->where('semester', $semester)
    ->exists();

if ($aptitudeExists) {
    DB::table('second_semester_aptitude')
        ->where('cadet_id', $galvezId)
        ->where('semester', $semester)
        ->update([
            'aptitude_30' => 22,
            'total_merits' => 110,
            'updated_at' => now()
        ]);
    echo "   ✓ Updated existing aptitude record: aptitude_30=22\n";
} else {
    DB::table('second_semester_aptitude')->insert([
        'cadet_id' => $galvezId,
        'type' => 'military_attitude',
        'semester' => $semester,
        'merits_week_1' => 8, 'demerits_week_1' => 2,
        'merits_week_2' => 9, 'demerits_week_2' => 1,
        'merits_week_3' => 7, 'demerits_week_3' => 3,
        'merits_week_4' => 8, 'demerits_week_4' => 1,
        'merits_week_5' => 6, 'demerits_week_5' => 2,
        'merits_week_6' => 9, 'demerits_week_6' => 1,
        'merits_week_7' => 8, 'demerits_week_7' => 2,
        'merits_week_8' => 7, 'demerits_week_8' => 1,
        'merits_week_9' => 8, 'demerits_week_9' => 2,
        'merits_week_10' => 9, 'demerits_week_10' => 1,
        'merits_week_11' => 8, 'demerits_week_11' => 3,
        'merits_week_12' => 7, 'demerits_week_12' => 1,
        'merits_week_13' => 8, 'demerits_week_13' => 2,
        'merits_week_14' => 9, 'demerits_week_14' => 1,
        'merits_week_15' => 7, 'demerits_week_15' => 2,
        'total_merits' => 110,
        'aptitude_30' => 22,
        'merits_array' => '[8,9,7,8,6,9,8,7,8,9,8,7,8,9,7]',
        'demerits_array' => '[2,1,3,1,2,1,2,1,2,1,3,1,2,1,2]',
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "   ✓ Created new aptitude record: aptitude_30=22\n";
}

echo "\n2. Testing calculations with new data...\n";

use App\Http\Controllers\FinalGradesController;
$controller = new FinalGradesController();
$reflection = new ReflectionClass($controller);

// Test individual calculations
$aptitudeMethod = $reflection->getMethod('calculateSecondSemesterAptitude');
$aptitudeMethod->setAccessible(true);
$aptitude = $aptitudeMethod->invoke($controller, $galvezId, $semester);

$attendanceMethod = $reflection->getMethod('calculateSecondSemesterAttendance');
$attendanceMethod->setAccessible(true);
$attendance = $attendanceMethod->invoke($controller, $galvezId, $semester);

$examMethod = $reflection->getMethod('calculateSecondSemesterExam');
$examMethod->setAccessible(true);
$exam = $examMethod->invoke($controller, $galvezId, $semester);

$total = $aptitude + $attendance + $exam;

echo "   Aptitude Score: $aptitude (expected: 22)\n";
echo "   Attendance Score: $attendance (expected: 25)\n";
echo "   Exam Score: $exam (expected: 36 from (85+95)/2*0.40)\n";
echo "   TOTAL ROTC Grade: $total (expected: ~83)\n\n";

echo "3. Testing API response...\n";
$request = new Illuminate\Http\Request(['semester' => $semester]);
$response = $controller->getFinalGrades($request);

if ($response->getStatusCode() === 200) {
    $data = json_decode($response->getContent(), true);
    $galvezData = collect($data)->firstWhere('id', $galvezId);
    
    if ($galvezData) {
        echo "   API ROTC Grade: {$galvezData['rotc_grade']}\n";
        echo "   API Final Grade: {$galvezData['final_grade']}\n";
        echo "   API Equivalent Grade: {$galvezData['equivalent_grade']}\n";
        echo "   API Remarks: {$galvezData['remarks']}\n";
    } else {
        echo "   ✗ Galvez not found in API response\n";
    }
} else {
    echo "   ✗ API Error: " . $response->getStatusCode() . "\n";
}

echo "\n4. Now edit exam scores and test again...\n";

// Update exam scores to different values
DB::table('second_semester_exam_scores')
    ->where('user_id', $galvezId)
    ->where('semester', $semester)
    ->update([
        'midterm_exam' => 90,
        'final_exam' => 100,
        'updated_at' => now()
    ]);

echo "   ✓ Updated exam scores: midterm=90, final=100\n";

// Test calculations again
$newExam = $examMethod->invoke($controller, $galvezId, $semester);
$newTotal = $aptitude + $attendance + $newExam;

echo "   New Exam Score: $newExam (expected: 38 from (90+100)/2*0.40)\n";
echo "   New TOTAL ROTC Grade: $newTotal (expected: ~85)\n";

// Test API again
$response2 = $controller->getFinalGrades($request);
if ($response2->getStatusCode() === 200) {
    $data2 = json_decode($response2->getContent(), true);
    $galvezData2 = collect($data2)->firstWhere('id', $galvezId);
    
    if ($galvezData2) {
        echo "   Updated API ROTC Grade: {$galvezData2['rotc_grade']}\n";
        echo "   Updated API Final Grade: {$galvezData2['final_grade']}\n";
        
        if ($galvezData2['rotc_grade'] != $galvezData['rotc_grade']) {
            echo "   ✓ SUCCESS: Grade changed from {$galvezData['rotc_grade']} to {$galvezData2['rotc_grade']}\n";
        } else {
            echo "   ✗ ISSUE: Grade did not change (still {$galvezData2['rotc_grade']})\n";
        }
    }
}

echo "\n=== TEST COMPLETE ===\n";