<?php

require_once 'vendor/autoload.php';

use App\Http\Controllers\AttendanceController;
use App\Models\User;
use App\Models\Attendance;
use Illuminate\Http\Request;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Attendance API...\n\n";

// Test 1: Check if users exist
echo "1. Checking users:\n";
$users = User::where('role', '!=', 'admin')->where('status', 'approved')->get();
echo "Found " . $users->count() . " approved non-admin users\n";
foreach ($users->take(3) as $user) {
    echo "- {$user->first_name} {$user->last_name} (ID: {$user->id}, Student: {$user->student_number})\n";
}
echo "\n";

// Test 2: Check attendance records
echo "2. Checking attendance records:\n";
$firstSemesterCount = Attendance::count();
echo "First semester attendance records: {$firstSemesterCount}\n";

if ($firstSemesterCount > 0) {
    $sampleAttendance = Attendance::with('user')->first();
    echo "Sample record - User: {$sampleAttendance->user->first_name} {$sampleAttendance->user->last_name}\n";
    echo "Weeks present: {$sampleAttendance->weeks_present}\n";
    echo "Week 1: " . ($sampleAttendance->week_1 ? 'Present' : 'Absent') . "\n";
    echo "Week 2: " . ($sampleAttendance->week_2 ? 'Present' : 'Absent') . "\n";
}
echo "\n";

// Test 3: Simulate API call
echo "3. Testing API controller:\n";
try {
    $request = new Request();
    $request->merge(['semester' => '2025-2026 1st semester']);
    
    $controller = new AttendanceController();
    $response = $controller->getCadets($request);
    
    $data = json_decode($response->getContent(), true);
    
    echo "API Response success: " . ($data['success'] ? 'true' : 'false') . "\n";
    if ($data['success']) {
        echo "Number of cadets returned: " . count($data['data']) . "\n";
        if (!empty($data['data'])) {
            $firstCadet = $data['data'][0];
            echo "First cadet: {$firstCadet['first_name']} {$firstCadet['last_name']}\n";
            echo "Weekly attendance keys: " . implode(', ', array_keys($firstCadet['weekly_attendance'])) . "\n";
            echo "Sample week values: ";
            foreach (array_slice($firstCadet['weekly_attendance'], 0, 5) as $week => $present) {
                echo "W{$week}:" . ($present ? 'P' : 'A') . " ";
            }
            echo "\n";
        }
    } else {
        echo "API Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\nTest completed.\n";