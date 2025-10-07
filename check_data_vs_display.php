<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING ACTUAL DATA vs DISPLAYED DATA ===\n\n";

echo "The issue appears to be a DISPLAY problem, not a data problem.\n";
echo "The API returns correct data for both semesters, but the frontend\n";
echo "shows different values. Let's verify the actual database state:\n\n";

echo "1. CHECKING EXAM SCORES (the most likely culprit):\n";
echo "=" . str_repeat("=", 60) . "\n";

$galvezIds = [14, 15, 16, 17]; // All Galvez records

foreach ($galvezIds as $userId) {
    echo "\nUser ID $userId:\n";
    echo str_repeat("-", 20) . "\n";
    
    // 1st semester exam scores
    $firstSem = DB::table('first_semester_exam_scores')
        ->where('user_id', $userId)
        ->first();
    
    echo "1st Semester Exam:\n";
    if ($firstSem) {
        echo "  Final Exam: {$firstSem->final_exam}\n";
    } else {
        echo "  No record found\n";
    }
    
    // 2nd semester exam scores  
    $secondSem = DB::table('second_semester_exam_scores')
        ->where('user_id', $userId)
        ->first();
    
    echo "2nd Semester Exam:\n";
    if ($secondSem) {
        echo "  Midterm: {$secondSem->midterm_exam}\n";
        echo "  Final: {$secondSem->final_exam}\n";
    } else {
        echo "  No record found\n";
    }
}

echo "\n\n2. CHECKING ATTENDANCE DATA:\n";
echo "=" . str_repeat("=", 60) . "\n";

foreach ($galvezIds as $userId) {
    echo "\nUser ID $userId Attendance:\n";
    echo str_repeat("-", 30) . "\n";
    
    // 1st semester attendance
    $firstAtt = DB::table('first_semester_attendance')
        ->where('user_id', $userId)
        ->first();
    
    echo "1st Semester:\n";
    if ($firstAtt) {
        echo "  Weeks Present: {$firstAtt->weeks_present}\n";
        echo "  Attendance 30: {$firstAtt->attendance_30}\n";
    } else {
        echo "  No record found\n";
    }
    
    // 2nd semester attendance
    $secondAtt = DB::table('second_semester_attendance')
        ->where('user_id', $userId)
        ->first();
    
    echo "2nd Semester:\n";
    if ($secondAtt) {
        echo "  Weeks Present: {$secondAtt->weeks_present}\n";
        echo "  Attendance 30: {$secondAtt->attendance_30}\n";
    } else {
        echo "  No record found\n";
    }
}

echo "\n\n3. CHECKING APTITUDE/MERIT DATA:\n";
echo "=" . str_repeat("=", 60) . "\n";

foreach ($galvezIds as $userId) {
    echo "\nUser ID $userId Aptitude:\n";
    echo str_repeat("-", 30) . "\n";
    
    // 1st semester (common grades table)
    $firstApt = DB::table('first_semester_common_grades')
        ->where('user_id', $userId)
        ->first();
    
    echo "1st Semester (Common Grades):\n";
    if ($firstApt) {
        echo "  Aptitude 30: {$firstApt->aptitude_30}\n";
    } else {
        echo "  No record found\n";
    }
    
    // 2nd semester (aptitude table)
    $secondApt = DB::table('second_semester_aptitude')
        ->where('cadet_id', $userId) // Note: might use cadet_id instead of user_id
        ->first();
    
    echo "2nd Semester (Aptitude):\n";
    if ($secondApt) {
        echo "  Aptitude 30: {$secondApt->aptitude_30}\n";
        echo "  Total Merits: {$secondApt->total_merits}\n";
        echo "  Total Demerits: {$secondApt->total_demerits}\n";
    } else {
        // Try with user_id instead
        $secondApt = DB::table('second_semester_aptitude')
            ->where('user_id', $userId)
            ->first();
        if ($secondApt) {
            echo "  Aptitude 30: {$secondApt->aptitude_30}\n";
            echo "  Total Merits: {$secondApt->total_merits}\n";
            echo "  Total Demerits: {$secondApt->total_demerits}\n";
        } else {
            echo "  No record found (tried both cadet_id and user_id)\n";
        }
    }
}

echo "\n\n4. CHECKING POSTED GRADES (what should be displayed):\n";
echo "=" . str_repeat("=", 60) . "\n";

$postedGrades = DB::table('user_grades')
    ->whereIn('user_id', $galvezIds)
    ->orderBy('user_id')
    ->orderBy('semester')
    ->get();

foreach ($postedGrades as $grade) {
    echo "User {$grade->user_id} - {$grade->semester}:\n";
    echo "  Final Grade: {$grade->final_grade}\n";
    echo "  Equivalent Grade: {$grade->equivalent_grade}\n";
    echo "  Remarks: {$grade->remarks}\n";
    echo "  Updated: {$grade->updated_at}\n\n";
}

echo "5. CONCLUSION:\n";
echo "=" . str_repeat("=", 60) . "\n";

echo "Based on this analysis:\n\n";

echo "1. If the API returns correct data for both semesters\n";
echo "2. But the FRONTEND shows incorrect data for 2nd semester\n";
echo "3. Then the issue is in the FRONTEND CALCULATION or CACHING\n\n";

echo "LIKELY CAUSES:\n";
echo "- Frontend calculation differences between semesters\n";
echo "- Frontend caching issues for 2nd semester\n";
echo "- Different data processing logic in the JavaScript\n";
echo "- Async loading issues where 2nd semester loads stale data\n\n";

echo "SOLUTION:\n";
echo "The fix needs to be in facultyFinalGrades.jsx:\n";
echo "- Force 2nd semester to always use fresh API data\n";
echo "- Bypass frontend caching for 2nd semester\n";
echo "- Add cache-busting parameters for 2nd semester API calls\n";
echo "- Add manual refresh button for 2nd semester\n\n";

echo "=== ANALYSIS COMPLETE ===\n";