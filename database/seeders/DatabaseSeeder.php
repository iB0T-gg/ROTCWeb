<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call the user seeder first
        $this->call(UserSeeder::class);
        // Create a test user
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'student_number' => '70022768',
                'first_name' => 'Test',
                'middle_name' => 'White',
                'last_name' => 'User',
                'year_course_section' => '1A',
                'phone_number' => '09730341394',
                'password' => Hash::make('password'),
                'role' => 'user',
                'status' => 'approved',
            ]
        );

        // Create admin user
        User::firstOrCreate(
            [ 'email' => 'admin@example.com' ],
            [
                'student_number' => '00000000',
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => '',
                'year_course_section' => 'N/A',
                'password' => Hash::make('admin@123'),
                'phone_number' => '0000000000',
                'role' => 'admin',
                'status' => 'approved',
            ]
        );

        // Create faculty user
        User::firstOrCreate(
            [ 'email' => 'faculty@example.com' ],
            [
                'student_number' => '00000001',
                'first_name' => 'Faculty',
                'middle_name' => '',
                'last_name' => '',
                'year_course_section' => 'N/A',
                'password' => Hash::make('faculty@123'),
                'phone_number' => '0000000001',
                'role' => 'faculty',
                'status' => 'approved',
            ]
        );

        // Create 10 random users using the factory (reduced to avoid conflicts)
        User::factory()->count(10)->create([
            'status' => 'approved',
        ]);
    }
}
