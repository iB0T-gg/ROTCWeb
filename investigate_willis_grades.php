<?php

require_once __DIR__ . '/vendor/autoload.php';
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== INVESTIGATING AUFDERHAR, WILLIS T. GRADES ===\n\n";

// Find the cadet by name
$cadet = DB::table('users')
    ->where('first_name', 'Willis')
    ->where('last_name', 'Aufderhar')
    ->where('role', 'user')
    ->first();

if (!$cadet) {
    echo "Cadet not found!\n";
    exit;
}

$userId = $cadet->id;
$semester = '2025-2026 1st semester';

echo "Found cadet: {$cadet->first_name} {$cadet->last_name} (ID: {$userId})\n\n";

// Check Common Module Grade
$commonModule = DB::table('first_semester_common_grade_module')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->first();

echo "=== COMMON MODULE ===\n";
if ($commonModule) {
    echo "Common Module Grade: " . $commonModule->common_module_grade . "\n";
} else {
    echo "No common module grade found\n";
}

// Check Aptitude (Merits/Demerits)
$aptitude = DB::table('first_semester_aptitude')
    ->where('cadet_id', $userId)
    ->first();

echo "\n=== APTITUDE (MERITS/DEMERITS) ===\n";
if ($aptitude) {
    echo "Aptitude 30 (stored): " . ($aptitude->aptitude_30 ?? 'NULL') . "\n";
    echo "Total Merits (stored): " . ($aptitude->total_merits ?? 'NULL') . "\n";
    
    // Show weekly data
    echo "Weekly Merit/Demerit Data:\n";
    $totalMerits = 0;
    $totalDemerits = 0;
    
    for ($i = 1; $i <= 10; $i++) {
        $merit = $aptitude->{"merits_week_$i"};
        $demerit = $aptitude->{"demerits_week_$i"};
        
        $meritValue = ($merit === null || $merit === '') ? 0 : (int) $merit;
        $demeritValue = ($demerit === null || $demerit === '' || $demerit === '-') ? 0 : (int) $demerit;
        
        $totalMerits += $meritValue;
        $totalDemerits += $demeritValue;
        
        echo "  Week $i: Merit=$merit, Demerit=$demerit\n";
    }
    
    echo "Calculated Totals: Merits=$totalMerits, Demerits=$totalDemerits\n";
    $netScore = max(0, $totalMerits - $totalDemerits);
    $aptitudePercentage = min(100, ($netScore / 70) * 100); // Assuming max 70
    $aptitude30 = min(30, round($aptitudePercentage * 0.30));
    echo "Net Score: $netScore\n";
    echo "Calculated Aptitude Percentage: " . round($aptitudePercentage, 2) . "%\n";
    echo "Calculated Aptitude 30: $aptitude30\n";
} else {
    echo "No aptitude record found\n";
}

// Check Attendance
$attendance = DB::table('first_semester_attendance')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->first();

echo "\n=== ATTENDANCE ===\n";
if ($attendance) {
    echo "Attendance 30 (stored): " . ($attendance->attendance_30 ?? 'NULL') . "\n";
    echo "Weeks Present (stored): " . ($attendance->weeks_present ?? 'NULL') . "\n";
    echo "Percentage (stored): " . ($attendance->percentage ?? 'NULL') . "\n";
    
    // Check weekly attendance
    echo "Weekly Attendance Data:\n";
    $presentCount = 0;
    
    for ($i = 1; $i <= 10; $i++) {
        $weekColumn = "week_{$i}";
        $isPresent = isset($attendance->$weekColumn) && $attendance->$weekColumn;
        echo "  Week $i: " . ($isPresent ? 'Present' : 'Absent') . "\n";
        if ($isPresent) $presentCount++;
    }
    
    echo "Calculated Present Count: $presentCount / 10\n";
    $attendancePercentage = ($presentCount / 10) * 100;
    $attendance30 = ($presentCount / 10) * 30;
    echo "Calculated Attendance Percentage: " . round($attendancePercentage, 2) . "%\n";
    echo "Calculated Attendance 30: " . round($attendance30) . "\n";
} else {
    echo "No attendance record found\n";
}

// Check Exam Scores
$exam = DB::table('first_semester_exam_scores')
    ->where('user_id', $userId)
    ->where('semester', $semester)
    ->first();

echo "\n=== EXAM SCORES ===\n";
if ($exam) {
    echo "Midterm Exam: " . ($exam->midterm_exam ?? 'NULL') . "\n";
    echo "Final Exam: " . ($exam->final_exam ?? 'NULL') . "\n";
    echo "Average (stored): " . ($exam->average ?? 'NULL') . "\n";
    
    $midterm = $exam->midterm_exam ? (float) $exam->midterm_exam : 0;
    $final = $exam->final_exam ? (float) $exam->final_exam : 0;
    
    if ($midterm > 0 || $final > 0) {
        $average = ($midterm + $final) / 2;
        $subjectProf40 = min(40, round($average * 0.40));
        echo "Calculated Average: " . round($average, 2) . "\n";
        echo "Calculated Subject Prof (40%): $subjectProf40\n";
    } else {
        echo "No exam scores entered\n";
    }
} else {
    echo "No exam record found\n";
}

echo "\n=== SUMMARY ===\n";
echo "For perfect scores, you should have:\n";
echo "- Aptitude: 30 points (perfect merit/demerit record)\n";
echo "- Attendance: 30 points (perfect attendance)\n";
echo "- Exams: 40 points (perfect exam scores)\n";
echo "- Total ROTC Grade: 100 points\n";
echo "- With Common Module 100: Final Grade = (100 + 100) / 2 = 100\n";