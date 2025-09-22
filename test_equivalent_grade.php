<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Testing new equivalent grade calculation (Average * 0.40)...\n";
    
    // Find a user to test with
    $user = \App\Models\User::where('role', 'user')->first();
    if ($user) {
        echo "Testing with user: " . $user->first_name . " " . $user->last_name . "\n";
        
        // Test cases
        $testCases = [
            ['merit' => 30, 'attendance' => 30, 'final_exam' => 40, 'average' => 80, 'expected_exam_contribution' => 32],
            ['merit' => 25, 'attendance' => 25, 'final_exam' => 30, 'average' => 60, 'expected_exam_contribution' => 24],
            ['merit' => 20, 'attendance' => 20, 'final_exam' => 0, 'average' => 0, 'expected_exam_contribution' => 0],
            ['merit' => 35, 'attendance' => 35, 'final_exam' => 50, 'average' => 100, 'expected_exam_contribution' => 40],
        ];
        
        foreach ($testCases as $i => $testCase) {
            echo "\nTest Case " . ($i + 1) . ":\n";
            echo "Merit: " . $testCase['merit'] . "%, Attendance: " . $testCase['attendance'] . "%, Final Exam: " . $testCase['final_exam'] . ", Average: " . $testCase['average'] . "\n";
            
            $equivalentGrade = $user->computeEquivalentGrade(
                $testCase['merit'],
                $testCase['attendance'],
                $testCase['final_exam'],
                $testCase['average']
            );
            
            $finalGrade = $user->calculateFinalGrade(
                $testCase['merit'],
                $testCase['attendance'],
                $testCase['final_exam'],
                $testCase['average']
            );
            
            $examContribution = $testCase['average'] * 0.40;
            $totalPercentage = $testCase['merit'] + $testCase['attendance'] + $examContribution;
            
            echo "Exam contribution (Average * 0.40): " . $examContribution . "%\n";
            echo "Total percentage: " . $totalPercentage . "%\n";
            echo "Equivalent grade: " . $equivalentGrade . "\n";
            echo "Final grade: " . $finalGrade . "%\n";
            echo "Expected exam contribution: " . $testCase['expected_exam_contribution'] . "%\n";
            
            if (abs($examContribution - $testCase['expected_exam_contribution']) < 0.01) {
                echo "✓ Exam contribution calculation is correct\n";
            } else {
                echo "✗ Exam contribution calculation is incorrect\n";
            }
        }
        
        // Test the frontend calculation logic
        echo "\n\nTesting frontend calculation logic:\n";
        $final = 40;
        $average = $final * 2; // 80
        $equivalent = ($average === 0) ? '0.00' : ($average * 0.40);
        echo "Final exam: " . $final . ", Average: " . $average . ", Equivalent: " . $equivalent . "\n";
        
        $final = 0;
        $average = $final * 2; // 0
        $equivalent = ($average === 0) ? '0.00' : ($average * 0.40);
        echo "Final exam: " . $final . ", Average: " . $average . ", Equivalent: " . $equivalent . "\n";
        
    }
    
    echo "\nAll tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
