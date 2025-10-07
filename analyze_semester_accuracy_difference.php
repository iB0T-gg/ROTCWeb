<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\FinalGradesController;

echo "=== ANALYZING 1ST VS 2ND SEMESTER ACCURACY ISSUE ===\n\n";

echo "ISSUE: 1st semester shows accurate data, 2nd semester does not.\n";
echo "Let's investigate why there's a difference...\n\n";

echo "1. CHECKING API RESPONSES FOR BOTH SEMESTERS:\n";
echo "=" . str_repeat("=", 60) . "\n";

$controller = new FinalGradesController();

foreach (['2025-2026 1st semester', '2025-2026 2nd semester'] as $semester) {
    echo "\n$semester:\n";
    echo str_repeat("-", 40) . "\n";
    
    try {
        $request = \Illuminate\Http\Request::create('/api/final-grades', 'GET', [
            'semester' => $semester,
            '_t' => time(),
            'force_refresh' => '1'
        ]);
        
        $response = $controller->getFinalGrades($request);
        $data = json_decode($response->getContent(), true);
        
        echo "API returned " . count($data) . " students\n";
        
        // Find Galvez records as test case
        $galvezRecords = array_filter($data, function($student) {
            return stripos($student['first_name'] . ' ' . $student['last_name'], 'galvez') !== false;
        });
        
        foreach ($galvezRecords as $student) {
            echo "  {$student['first_name']} {$student['last_name']} (ID {$student['id']}):\n";
            echo "    Final Grade: {$student['final_grade']}\n";
            echo "    Equivalent Grade: {$student['equivalent_grade']}\n";
            echo "    Remarks: {$student['remarks']}\n";
            
            if (isset($student['exam_data'])) {
                if ($semester === '2025-2026 1st semester') {
                    echo "    Exam: Final={$student['exam_data']['final_exam']}\n";
                } else {
                    echo "    Exam: Midterm={$student['exam_data']['midterm_exam']}, Final={$student['exam_data']['final_exam']}\n";
                }
            }
            echo "\n";
        }
        
    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}

echo "\n2. CHECKING POSTED GRADES IN DATABASE:\n";
echo "=" . str_repeat("=", 60) . "\n";

$postedGrades = DB::table('user_grades')
    ->join('users', 'user_grades.user_id', '=', 'users.id')
    ->where('users.first_name', 'like', '%Galvez%')
    ->select('users.first_name', 'users.last_name', 'user_grades.*')
    ->orderBy('user_grades.semester')
    ->get();

foreach ($postedGrades as $grade) {
    echo "{$grade->first_name} {$grade->last_name} - {$grade->semester}:\n";
    echo "  Posted: Final={$grade->final_grade}, Equiv={$grade->equivalent_grade}, Remarks={$grade->remarks}\n";
    echo "  Updated: {$grade->updated_at}\n\n";
}

echo "3. IDENTIFYING THE DIFFERENCES:\n";
echo "=" . str_repeat("=", 60) . "\n";

echo "KEY DIFFERENCES BETWEEN 1ST AND 2ND SEMESTER:\n\n";

echo "A) DATA SOURCES:\n";
echo "   1st semester:\n";
echo "   - Uses 'first_semester_exam_scores' table\n";
echo "   - Has 'first_semester_common_grades' for aptitude\n";
echo "   - Has 'first_semester_attendance' table\n\n";

echo "   2nd semester:\n";
echo "   - Uses 'second_semester_exam_scores' table\n";
echo "   - Uses 'second_semester_aptitude' table (different structure)\n";
echo "   - Uses 'second_semester_attendance' table\n\n";

echo "B) CALCULATION DIFFERENCES:\n";
echo "   1st semester:\n";
echo "   - Final Grade = (ROTC Grade + Common Module) / 2\n";
echo "   - Exam calculation: Final Exam * 2 * 0.40\n\n";

echo "   2nd semester:\n";
echo "   - Final Grade = ROTC Grade only\n";
echo "   - Exam calculation: (Midterm + Final) / 2 * 0.40\n\n";

echo "C) FRONTEND PROCESSING:\n";
echo "   Lines 94-106 in facultyFinalGrades.jsx:\n";
echo "   - Special handling for 2nd semester aptitude data\n";
echo "   - Different merit mapping structure\n";
echo "   - Uses 'cadet_id' vs 'user_id' in some tables\n\n";

echo "4. POTENTIAL CAUSES OF INACCURACY:\n";
echo "=" . str_repeat("=", 60) . "\n";

echo "1. CACHING ISSUES:\n";
echo "   - Frontend caches 2nd semester data differently\n";
echo "   - Line 186-194: Extra cache clearing for 2nd semester\n";
echo "   - Suggests known caching problems\n\n";

echo "2. DATA STRUCTURE MISMATCH:\n";
echo "   - 'cadet_id' vs 'user_id' inconsistency\n";
echo "   - Different aptitude table structure\n";
echo "   - Merit array handling differences\n\n";

echo "3. CALCULATION TIMING:\n";
echo "   - 1st semester uses backend pre-calculated values\n";
echo "   - 2nd semester does real-time frontend calculations\n";
echo "   - Sync issues between backend and frontend\n\n";

echo "4. EXAM SCORE UPDATES:\n";
echo "   - When you update exam scores in facultyExams.jsx\n";
echo "   - 1st semester might auto-refresh posted grades\n";
echo "   - 2nd semester might not update posted grades\n\n";

echo "5. ANALYZING CURRENT CODE BEHAVIOR:\n";
echo "=" . str_repeat("=", 60) . "\n";

echo "In fetchDataForSemester function:\n";
echo "- Line 53: shouldForceRefresh = forceRefresh (no special 2nd semester handling)\n";
echo "- Line 55-65: Serves from cache if available\n";
echo "- Line 94-106: Special 2nd semester merit processing\n";
echo "- Line 136-148: Updates cache for both semesters equally\n\n";

echo "CONCLUSION:\n";
echo "The issue is likely that 2nd semester data gets cached and doesn't\n";
echo "refresh when exam scores are updated, while 1st semester data\n";
echo "refreshes properly or uses different calculation paths.\n\n";

echo "SOLUTION NEEDED:\n";
echo "1. Force 2nd semester to always fetch fresh data\n";
echo "2. Ensure exam score updates trigger cache invalidation\n";
echo "3. Add manual refresh capability for 2nd semester\n";
echo "4. Synchronize posted grades when exam scores change\n\n";

echo "=== ANALYSIS COMPLETE ===\n";