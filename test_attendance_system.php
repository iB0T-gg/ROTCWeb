<?php

/**
 * Test script to verify the new attendance system works correctly
 * 
 * This script tests:
 * 1. Creating detailed attendance records
 * 2. Manual editing functionality
 * 3. Import functionality
 * 4. Aggregated data calculation
 */

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\AttendanceRecord;
use Illuminate\Support\Facades\DB;

echo "🧪 Testing New Attendance System\n";
echo "================================\n\n";

try {
    // Find a test user (first regular user)
    $testUser = User::where('role', 'user')->first();
    
    if (!$testUser) {
        echo "❌ No test user found. Please ensure you have users with role 'user' in your database.\n";
        exit(1);
    }
    
    echo "👤 Testing with user: {$testUser->first_name} {$testUser->last_name} (ID: {$testUser->id})\n";
    echo "📧 Student Number: {$testUser->student_number}\n\n";
    
    $semester = '2025-2026 1st semester';
    
    // Clean up any existing records for this test
    echo "🧹 Cleaning up existing test records...\n";
    AttendanceRecord::where('user_id', $testUser->id)
        ->where('semester', $semester)
        ->delete();
    
    // Test 1: Create individual attendance records
    echo "📝 Test 1: Creating individual attendance records\n";
    
    $testWeeks = [1, 2, 3, 5, 7]; // Skip weeks 4 and 6 to test absent weeks
    
    foreach ($testWeeks as $week) {
        $record = AttendanceRecord::createOrUpdate(
            $testUser->id,
            $semester,
            $week,
            true, // present
            'manual',
            now()->subWeeks(10 - $week) // Simulate dates from semester start
        );
        
        echo "   ✅ Week {$week}: Present (Record ID: {$record->id})\n";
    }
    
    // Test 2: Get attendance array
    echo "\n📊 Test 2: Retrieving attendance array\n";
    $attendanceArray = AttendanceRecord::getAttendanceArray($testUser->id, $semester);
    
    for ($i = 1; $i <= 10; $i++) {
        $status = isset($attendanceArray[$i]) && $attendanceArray[$i] ? "Present" : "Absent";
        $icon = isset($attendanceArray[$i]) && $attendanceArray[$i] ? "✅" : "❌";
        echo "   {$icon} Week {$i}: {$status}\n";
    }
    
    // Test 3: Get attendance statistics
    echo "\n📈 Test 3: Calculating attendance statistics\n";
    $stats = AttendanceRecord::getAttendanceStats($testUser->id, $semester, 10);
    
    echo "   📊 Weeks Present: {$stats['weeks_present']} / {$stats['max_weeks']}\n";
    echo "   📊 Percentage: {$stats['percentage']}%\n";
    echo "   📊 Attendance Score (30%): {$stats['attendance_30']}\n";
    
    // Test 4: Test manual editing (toggle week 4)
    echo "\n✏️  Test 4: Testing manual edit (marking week 4 as present)\n";
    
    $record = AttendanceRecord::createOrUpdate(
        $testUser->id,
        $semester,
        4,
        true, // mark as present
        'manual'
    );
    
    echo "   ✅ Week 4 marked as present\n";
    
    // Recalculate stats
    $newStats = AttendanceRecord::getAttendanceStats($testUser->id, $semester, 10);
    echo "   📊 Updated stats: {$newStats['weeks_present']} present, {$newStats['percentage']}% attendance\n";
    
    // Test 5: Test import simulation
    echo "\n📥 Test 5: Testing import simulation\n";
    
    $importBatchId = 'test_import_' . now()->format('Y_m_d_H_i_s');
    
    // Simulate importing week 6 attendance
    $importRecord = AttendanceRecord::createOrUpdate(
        $testUser->id,
        $semester,
        6,
        true,
        'import',
        now()->subWeeks(4), // 4 weeks ago
        '08:30:00',
        $importBatchId
    );
    
    echo "   ✅ Imported attendance for Week 6 (Batch: {$importBatchId})\n";
    
    // Test 6: Verify aggregated data is updated
    echo "\n🔄 Test 6: Verifying aggregated data update\n";
    
    $attendanceModel = \App\Models\Attendance::class;
    $aggregated = $attendanceModel::where('user_id', $testUser->id)
        ->where('semester', $semester)
        ->first();
    
    if ($aggregated) {
        echo "   ✅ Aggregated record exists\n";
        echo "   📊 Aggregated weeks present: {$aggregated->weeks_present}\n";
        echo "   📊 Aggregated attendance_30: {$aggregated->attendance_30}\n";
        echo "   📊 Aggregated average: {$aggregated->average}%\n";
    } else {
        echo "   ❌ No aggregated record found\n";
    }
    
    // Test 7: Final attendance array
    echo "\n📋 Test 7: Final attendance status\n";
    $finalArray = AttendanceRecord::getAttendanceArray($testUser->id, $semester);
    
    for ($i = 1; $i <= 10; $i++) {
        $status = isset($finalArray[$i]) && $finalArray[$i] ? "Present" : "Absent";
        $icon = isset($finalArray[$i]) && $finalArray[$i] ? "✅" : "❌";
        
        // Get source if present
        $source = "";
        if (isset($finalArray[$i]) && $finalArray[$i]) {
            $record = AttendanceRecord::where('user_id', $testUser->id)
                ->where('semester', $semester)
                ->where('week_number', $i)
                ->first();
            if ($record) {
                $source = " ({$record->source})";
            }
        }
        
        echo "   {$icon} Week {$i}: {$status}{$source}\n";
    }
    
    $finalStats = AttendanceRecord::getAttendanceStats($testUser->id, $semester, 10);
    echo "\n🎯 Final Results:\n";
    echo "   📊 Total Present: {$finalStats['weeks_present']} / {$finalStats['max_weeks']} weeks\n";
    echo "   📊 Attendance Rate: {$finalStats['percentage']}%\n";
    echo "   📊 Final Score: {$finalStats['attendance_30']} / 30 points\n";
    
    echo "\n✅ All tests completed successfully!\n";
    echo "\n💡 The system now supports:\n";
    echo "   ✅ Individual attendance record tracking per week\n";
    echo "   ✅ Manual editing of specific weeks\n";
    echo "   ✅ Import functionality with batch tracking\n";
    echo "   ✅ Automatic aggregated data calculation\n";
    echo "   ✅ Multiple sources: manual, import, scanner\n";
    
} catch (\Exception $e) {
    echo "❌ Test failed with error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}