<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\FinalGradesController;
use Illuminate\Http\Request;

echo "Final test of 2nd semester grade accuracy...\n\n";

$controller = new FinalGradesController();
$request = new Request(['semester' => '2025-2026 2nd semester', 'force_refresh' => 1]);

$response = $controller->getFinalGrades($request);
$data = json_decode($response->getContent(), true);

echo "Testing grade accuracy for 2nd semester:\n";
echo "======================================\n\n";

$sampleCount = 0;
foreach ($data as $cadet) {
    if ($sampleCount >= 3) break; // Show first 3 cadets
    
    echo "Cadet ID: " . $cadet['id'] . " - " . $cadet['first_name'] . " " . $cadet['last_name'] . "\n";
    echo "  ROTC Grade: " . $cadet['rotc_grade'] . "/100\n";
    echo "  Final Grade: " . $cadet['final_grade'] . "/100\n";
    echo "  Equivalent Grade: " . $cadet['equivalent_grade'] . "\n";
    echo "  Remarks: " . $cadet['remarks'] . "\n";
    
    // Show component breakdown if available
    if (isset($cadet['aptitude_data']) && isset($cadet['attendance_data']) && isset($cadet['exam_data'])) {
        $aptScore = $cadet['aptitude_data']['aptitude_30'];
        $attScore = $cadet['attendance_data']['attendance_30'];
        
        $midterm = $cadet['exam_data']['midterm_exam'];
        $final = $cadet['exam_data']['final_exam'];
        $examAvg = ($midterm + $final) / 2;
        $examScore = min(40, round($examAvg * 0.40));
        
        $totalCalculated = $aptScore + $attScore + $examScore;
        
        echo "  Components:\n";
        echo "    - Aptitude: {$aptScore}/30\n";
        echo "    - Attendance: {$attScore}/30\n";
        echo "    - Exams (M:{$midterm}, F:{$final}): {$examScore}/40\n";
        echo "    - Calculated Total: {$totalCalculated}/100\n";
        echo "    - Matches Backend: " . ($totalCalculated == $cadet['rotc_grade'] ? "✓ Yes" : "✗ No") . "\n";
    }
    
    echo "\n";
    $sampleCount++;
}

echo "Summary:\n";
echo "- Total cadets processed: " . count($data) . "\n";
echo "- Backend now provides structured aptitude_data, exam_data, and attendance_data\n";
echo "- ROTC Grade = Aptitude (30) + Attendance (30) + Subject Prof (40)\n";
echo "- Final Grade = ROTC Grade (for 2nd semester)\n";
echo "- Equivalent grades computed from percentage ranges\n";
echo "- Frontend can now use backend calculations for accuracy\n";