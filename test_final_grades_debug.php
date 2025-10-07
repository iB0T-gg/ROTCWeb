<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Attendance;
use App\Models\Merit;
use App\Models\ExamScore;
use App\Models\FirstSemesterCommonGrade;
use App\Models\UserGrade;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== FINAL GRADES DEBUG TEST ===\n\n";

try {
    // Get first few cadets for testing
    $cadets = User::where('role', 'user')->take(3)->get();
    
    foreach ($cadets as $cadet) {
        echo "CADET: {$cadet->last_name}, {$cadet->first_name} (ID: {$cadet->id})\n";
        echo "----------------------------------------\n";
        
        // Check attendance
        $attendance = Attendance::where('user_id', $cadet->id)->first();
        if ($attendance) {
            echo "Attendance Record Found:\n";
            echo "  - Percentage: " . ($attendance->percentage ?? 'NULL') . "\n";
            echo "  - Merits Array: " . json_encode($attendance->merits_array ?? []) . "\n";
            echo "  - Attendances: " . json_encode($attendance->attendances ?? []) . "\n";
        } else {
            echo "No attendance record found\n";
        }
        
        // Check merits
        $merit = Merit::where('cadet_id', $cadet->id)->first();
        if ($merit) {
            echo "Merit Record Found:\n";
            echo "  - Merits Array: " . json_encode($merit->merits_array ?? []) . "\n";
            echo "  - Demerits Array: " . json_encode($merit->demerits_array ?? []) . "\n";
            echo "  - Merit Percentage: " . ($merit->merit_percentage ?? 'NULL') . "\n";
        } else {
            echo "No merit record found\n";
        }
        
        // Check exam scores
        $examScore = ExamScore::where('user_id', $cadet->id)->first();
        if ($examScore) {
            echo "Exam Score Record Found:\n";
            echo "  - Written: " . ($examScore->written ?? 'NULL') . "\n";
            echo "  - Practical: " . ($examScore->practical ?? 'NULL') . "\n";
            echo "  - Percentage: " . ($examScore->percentage ?? 'NULL') . "\n";
        } else {
            echo "No exam score record found\n";
        }
        
        // Check common module grade (first semester only)
        $commonGrade = FirstSemesterCommonGrade::where('user_id', $cadet->id)->first();
        if ($commonGrade) {
            echo "Common Module Grade Found: " . ($commonGrade->grade ?? 'NULL') . "\n";
        } else {
            echo "No common module grade found\n";
        }
        
        // Check user grade
        $userGrade = UserGrade::where('user_id', $cadet->id)->first();
        if ($userGrade) {
            echo "User Grade Record Found:\n";
            echo "  - Final Grade: " . ($userGrade->final_grade ?? 'NULL') . "\n";
            echo "  - Equivalent Grade: " . ($userGrade->equivalent_grade ?? 'NULL') . "\n";
            echo "  - ROTC Grade: " . ($userGrade->rotc_grade ?? 'NULL') . "\n";
            echo "  - Updated At: " . ($userGrade->updated_at ?? 'NULL') . "\n";
        } else {
            echo "No user grade record found\n";
        }
        
        echo "\n";
    }
    
    // Check if there are any recent changes to grades
    echo "=== RECENT GRADE CHANGES ===\n";
    $recentGrades = UserGrade::where('updated_at', '>=', now()->subHours(2))
        ->with('user')
        ->orderBy('updated_at', 'desc')
        ->get();
        
    foreach ($recentGrades as $grade) {
        echo "RECENT CHANGE: {$grade->user->last_name}, {$grade->user->first_name}\n";
        echo "  - Final Grade: {$grade->final_grade}\n";
        echo "  - Equivalent Grade: {$grade->equivalent_grade}\n";
        echo "  - Updated: {$grade->updated_at}\n\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}