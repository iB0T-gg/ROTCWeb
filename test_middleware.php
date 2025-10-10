<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Auth;

// Get admin user
$admin = User::where('role', 'admin')->first();

if ($admin) {
    echo "Found admin user:\n";
    echo "ID: " . $admin->id . "\n";
    echo "Email: " . $admin->email . "\n";
    echo "Status: " . $admin->status . "\n";
    echo "Role: " . $admin->role . "\n";
} else {
    echo "No admin user found\n";
}