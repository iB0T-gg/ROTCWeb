<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create test users if there are none in the database
        if (User::count() == 0) {
            // Create an admin user
            User::create([
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => 'User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'approved',
            ]);
            
            // Create some test cadet users
            for ($i = 1; $i <= 10; $i++) {
                User::create([
                    'first_name' => "Cadet{$i}",
                    'middle_name' => "M",
                    'last_name' => "Test{$i}",
                    'email' => "cadet{$i}@example.com",
                    'password' => Hash::make('password'),
                    'student_number' => "2025-{$i}",
                    'role' => 'user',
                    'status' => 'approved',
                    'platoon' => rand(1, 3),
                    'company' => ['A', 'B', 'C'][rand(0, 2)],
                    'battalion' => rand(1, 2),
                ]);
            }
        }
    }
}
