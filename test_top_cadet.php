<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "=== Testing Top Cadet Query ===\n";
    
    // Check if users table exists and what columns it has
    echo "Checking users table structure...\n";
    $columns = DB::select("SHOW COLUMNS FROM users");
    $columnNames = array_map(function($col) { return $col->Field; }, $columns);
    echo "Available columns: " . implode(', ', $columnNames) . "\n\n";
    
    // Check if equivalent_grade column exists
    if (in_array('equivalent_grade', $columnNames)) {
        echo "✓ equivalent_grade column exists\n";
    } else {
        echo "✗ equivalent_grade column does NOT exist\n";
    }
    
    // Check total users
    $totalUsers = User::count();
    echo "Total users: $totalUsers\n";
    
    // Check users with role 'user'
    $cadets = User::where('role', 'user')->count();
    echo "Users with role 'user': $cadets\n";
    
    // Check users with equivalent_grade
    if (in_array('equivalent_grade', $columnNames)) {
        $usersWithGrades = User::where('role', 'user')
            ->whereNotNull('equivalent_grade')
            ->count();
        echo "Cadets with equivalent_grade: $usersWithGrades\n";
        
        // Try to get top cadet
        $topCadet = User::where('role', 'user')
            ->whereNotNull('equivalent_grade')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'equivalent_grade', 'final_grade', 'year', 'course', 'section')
            ->orderBy('equivalent_grade')
            ->first();
        
        if ($topCadet) {
            echo "✓ Top cadet found: " . $topCadet->first_name . " " . $topCadet->last_name . "\n";
            echo "  Grade: " . $topCadet->equivalent_grade . "\n";
        } else {
            echo "✗ No top cadet found\n";
        }
    } else {
        echo "Cannot check for users with equivalent_grade - column doesn't exist\n";
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}