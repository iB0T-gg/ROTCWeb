<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking admin users...\n\n";

$admins = \App\Models\User::where('role', 'admin')->get();
echo "Admin users found: " . $admins->count() . "\n";

foreach($admins as $admin) {
    echo "- {$admin->first_name} {$admin->last_name} (ID: {$admin->id}, Email: {$admin->email}, Status: {$admin->status})\n";
}

echo "\nChecking all users:\n";
$allUsers = \App\Models\User::all();
foreach($allUsers as $user) {
    echo "- {$user->first_name} {$user->last_name} - Role: {$user->role}, Status: {$user->status}\n";
}