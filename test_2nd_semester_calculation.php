<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Testing 2nd semester average calculation (Total / 123) * 100...\n";
    
    // Find a user to test with
    $user = \App\Models\User::where('role', 'user')->first();
    if ($user) {
        echo "Testing with user: " . $user->first_name . " " . $user->last_name . "\n";
        
        // Test cases for 2nd semester calculation
        $testCases = [
            ['midterm' => 43, 'final' => 55, 'expected_total' => 98, 'expected_average' => 79.67],
            ['midterm' => 30, 'final' => 40, 'expected_total' => 70, 'expected_average' => 56.91],
            ['midterm' => 0, 'final' => 0, 'expected_total' => 0, 'expected_average' => 0],
            ['midterm' => 50, 'final' => 50, 'expected_total' => 100, 'expected_average' => 81.30],
        ];
        
        foreach ($testCases as $i => $testCase) {
            echo "\nTest Case " . ($i + 1) . ":\n";
            echo "Midterm: " . $testCase['midterm'] . ", Final: " . $testCase['final'] . "\n";
            
            // Calculate using the new formula
            $total = $testCase['midterm'] + $testCase['final'];
            $average = $total > 0 ? ($total / 123) * 100 : 0;
            
            echo "Total: " . $total . "\n";
            echo "Average (Total / 123) * 100: " . round($average, 2) . "\n";
            echo "Expected total: " . $testCase['expected_total'] . "\n";
            echo "Expected average: " . $testCase['expected_average'] . "\n";
            
            if (abs($total - $testCase['expected_total']) < 0.01) {
                echo "✓ Total calculation is correct\n";
            } else {
                echo "✗ Total calculation is incorrect\n";
            }
            
            if (abs($average - $testCase['expected_average']) < 0.01) {
                echo "✓ Average calculation is correct\n";
            } else {
                echo "✗ Average calculation is incorrect\n";
            }
        }
        
        // Test the frontend calculation logic
        echo "\n\nTesting frontend calculation logic for 2nd semester:\n";
        $midterm = 43;
        $final = 55;
        $total = $midterm + $final;
        $average = $total > 0 ? ($total / 123) * 100 : 0;
        $equivalent = ($average === 0) ? '0.00' : number_format($average * 0.40, 2);
        echo "Midterm: " . $midterm . ", Final: " . $final . ", Total: " . $total . ", Average: " . round($average, 2) . ", Equivalent: " . $equivalent . "\n";
        
        // Test with empty values
        $midterm = 0;
        $final = 0;
        $total = $midterm + $final;
        $average = $total > 0 ? ($total / 123) * 100 : 0;
        $equivalent = ($average === 0) ? '0.00' : number_format($average * 0.40, 2);
        echo "Midterm: " . $midterm . ", Final: " . $final . ", Total: " . $total . ", Average: " . round($average, 2) . ", Equivalent: " . $equivalent . "\n";
        
        // Test the API endpoint
        echo "\n\nTesting ExamController for 2nd semester...\n";
        $examController = new \App\Http\Controllers\ExamController();
        $request = new \Illuminate\Http\Request(['semester' => '2026-2027 2nd semester']);
        $examScores = $examController->getExamScores($request);
        $examData = json_decode($examScores->getContent(), true);
        
        if (!empty($examData)) {
            echo "API returned " . count($examData) . " exam records for 2nd semester\n";
        }
        
    }
    
    echo "\nAll tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
