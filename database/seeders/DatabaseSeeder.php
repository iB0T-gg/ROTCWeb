<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear existing users to prevent unique constraint violations
        // Comment this line if you want to keep existing users
        DB::table('users')->truncate();
        
        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'student_number' => 'ADMIN000',
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => 'User',
                'year' => 'N/A',
                'course' => 'N/A',
                'section' => 'N/A',
                'password' => Hash::make('admin@123'),
                'phone_number' => '0000000000',
                'role' => 'admin',
                'status' => 'approved',
            ]
        );

        // Create faculty user
        User::firstOrCreate(
            ['email' => 'faculty@example.com'],
            [
                'student_number' => 'FACULTY000',
                'first_name' => 'Faculty',
                'middle_name' => '',
                'last_name' => 'User',
                'year' => 'N/A',
                'course' => 'N/A',
                'section' => 'N/A',
                'password' => Hash::make('faculty@123'),
                'phone_number' => '0000000001',
                'role' => 'faculty',
                'status' => 'approved',
            ]
        );
        
        // Create a test cadet user
        User::firstOrCreate(
            ['email' => 'cadet@example.com'],
            [
                'student_number' => '70022768',
                'first_name' => 'Test',
                'middle_name' => 'White',
                'last_name' => 'Cadet',
                'year' => '1G',
                'course' => 'BSIT',
                'section' => 'G1',
                'phone_number' => '09730341394',
                'password' => Hash::make('cadet@123'),
                'role' => 'user', // 'user' role represents cadets
                'status' => 'approved',
            ]
        );

        // Create 10 random cadet users using the factory
        User::factory()->count(10)->create([
            'status' => 'approved',
            'role' => 'user', // Ensure all are cadets
        ]);
    }
}
