<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== SEARCHING FOR GALVEZ USER ===\n\n";

// Search for users with similar names
$users = DB::table('users')
    ->where(function($query) {
        $query->where('last_name', 'like', '%Galvez%')
              ->orWhere('first_name', 'like', '%Jewell%')
              ->orWhere('first_name', 'like', '%Toby%')
              ->orWhere('last_name', 'like', '%Toby%');
    })
    ->get();

echo "Found users matching search:\n";
foreach($users as $user) {
    echo "  - {$user->first_name} {$user->last_name} (ID: {$user->id}) - {$user->email}\n";
    
    // Check if this user has any posted grades
    $grades = DB::table('user_grades')->where('user_id', $user->id)->count();
    echo "    Posted grades: $grades\n";
}

if (count($users) == 0) {
    echo "No users found matching Galvez/Jewell/Toby. Let me show first 10 users:\n";
    $allUsers = DB::table('users')->limit(10)->get();
    foreach($allUsers as $user) {
        $grades = DB::table('user_grades')->where('user_id', $user->id)->count();
        echo "  - {$user->first_name} {$user->last_name} (ID: {$user->id}) - Grades: $grades\n";
    }
}

echo "\n=== SEARCH COMPLETE ===\n";