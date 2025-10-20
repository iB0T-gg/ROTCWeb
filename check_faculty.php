<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Checking faculty user data...\n\n";

// Find the faculty user
$user = User::where('first_name', 'Juan')
    ->where('last_name', 'Dela Cruz')
    ->first();

if ($user) {
    echo "Faculty user found:\n";
    echo "ID: " . $user->id . "\n";
    echo "Name: " . $user->first_name . " " . $user->last_name . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Company: " . ($user->company ?? 'NULL') . "\n";
    echo "Battalion: " . ($user->battalion ?? 'NULL') . "\n";
    echo "Status: " . $user->status . "\n";
    
    // Check if filtering should apply
    $shouldFilter = $user->role === 'faculty' && $user->company && $user->battalion;
    echo "Should apply filtering: " . ($shouldFilter ? 'YES' : 'NO') . "\n";
    
    if ($shouldFilter) {
        echo "\nExpected to see only cadets from:\n";
        echo "Company: " . $user->company . "\n";
        echo "Battalion: " . $user->battalion . "\n";
        
        // Count cadets that should be visible
        $cadetCount = User::where('role', 'user')
            ->where('status', 'approved')
            ->where('archived', false)
            ->where('company', $user->company)
            ->where('battalion', $user->battalion)
            ->count();
            
        echo "Number of cadets that should be visible: " . $cadetCount . "\n";
    }
} else {
    echo "Faculty user not found!\n";
}

echo "\nTotal approved cadets in system: " . User::where('role', 'user')->where('status', 'approved')->where('archived', false)->count() . "\n";
