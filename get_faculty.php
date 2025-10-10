<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$faculty = \App\Models\User::where('role', 'faculty')->first();
if ($faculty) {
    echo "Faculty Email: " . $faculty->email . "\n";
    echo "Faculty Name: " . $faculty->first_name . " " . $faculty->last_name . "\n";
    echo "Faculty Status: " . $faculty->status . "\n";
} else {
    echo "No faculty user found!\n";
}