<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Adding test exam data for 2nd semester...\n";

// Add some test exam data
DB::table('second_semester_exam_scores')
    ->where('user_id', 3)
    ->update([
        'midterm_exam' => 85,
        'final_exam' => 90,
        'updated_at' => now()
    ]);

echo "Added test exam scores: midterm=85, final=90 for user 3\n";

// Add some test attendance data
DB::table('second_semester_attendance')
    ->updateOrInsert(
        ['user_id' => 3, 'semester' => '2025-2026 2nd semester'],
        [
            'week_1' => 1, 'week_2' => 1, 'week_3' => 1, 'week_4' => 1, 'week_5' => 1,
            'week_6' => 1, 'week_7' => 1, 'week_8' => 1, 'week_9' => 1, 'week_10' => 1,
            'week_11' => 1, 'week_12' => 1, 'week_13' => 1, 'week_14' => 1, 'week_15' => 1,
            'weeks_present' => 15,
            'attendance_30' => 30,
            'updated_at' => now()
        ]
    );

echo "Added test attendance data: perfect attendance (15/15 weeks) for user 3\n";

// Test the API again
use App\Http\Controllers\FinalGradesController;
use Illuminate\Http\Request;

$controller = new FinalGradesController();
$request = new Request(['semester' => '2025-2026 2nd semester', 'force_refresh' => 1]);

$response = $controller->getFinalGrades($request);
$data = json_decode($response->getContent(), true);

$testCadet = null;
foreach ($data as $cadet) {
    if ($cadet['id'] == 3) {
        $testCadet = $cadet;
        break;
    }
}

if ($testCadet) {
    echo "\nUpdated test cadet data:\n";
    echo "ID: " . $testCadet['id'] . "\n";
    echo "Name: " . $testCadet['first_name'] . " " . $testCadet['last_name'] . "\n";
    echo "ROTC Grade: " . $testCadet['rotc_grade'] . "\n";
    echo "Final Grade: " . $testCadet['final_grade'] . "\n";
    echo "Equivalent Grade: " . $testCadet['equivalent_grade'] . "\n";
    echo "Remarks: " . $testCadet['remarks'] . "\n";
    
    if (isset($testCadet['aptitude_data'])) {
        echo "Aptitude 30: " . $testCadet['aptitude_data']['aptitude_30'] . "\n";
    }
    
    if (isset($testCadet['exam_data'])) {
        echo "Midterm: " . $testCadet['exam_data']['midterm_exam'] . "\n";
        echo "Final exam: " . $testCadet['exam_data']['final_exam'] . "\n";
    }
    
    if (isset($testCadet['attendance_data'])) {
        echo "Attendance 30: " . $testCadet['attendance_data']['attendance_30'] . "\n";
        echo "Weeks present: " . $testCadet['attendance_data']['weeks_present'] . "\n";
    }
    
    // Calculate what the components should be:
    echo "\nExpected component breakdown for 2nd semester:\n";
    echo "- Aptitude (30%): 30/30\n";
    echo "- Attendance (30%): 30/30\n";
    echo "- Exam avg (40%): (85+90)/2 * 0.40 = " . round((85+90)/2 * 0.40) . "/40\n";
    echo "- Total ROTC Grade: " . (30 + 30 + round((85+90)/2 * 0.40)) . "/100\n";
}