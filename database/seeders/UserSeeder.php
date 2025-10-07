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
                'student_number' => 'ADMIN000',
                'first_name' => 'Admin',
                'middle_name' => '',
                'last_name' => 'User',
                'email' => 'admin@example.com',
                'password' => Hash::make('admin@123'),
                'role' => 'admin',
                'status' => 'approved',
            ]);

            // Create a faculty user
            User::create([
                'student_number' => 'FACULTY000',
                'first_name' => 'Faculty',
                'middle_name' => '',
                'last_name' => 'User',
                'email' => 'faculty@example.com',
                'password' => Hash::make('faculty@123'),
                'role' => 'faculty',
                'status' => 'approved',
            ]);
            
            // Create a robust test set of cadet users (>= 111 cadets)
            $totalCadets = 150;
            $letters = range('A', 'Z');
            for ($i = 1; $i <= $totalCadets; $i++) {
                $gender = rand(0, 1) ? 'Male' : 'Female';
                // Distribute last names alphabetically for meaningful sorting
                $letter = $letters[($i - 1) % count($letters)];
                $lastName = sprintf('%s_Cadet_%03d', $letter, $i);
                $firstName = sprintf('Cadet%03d', $i);

                User::create([
                    'first_name' => $firstName,
                    'middle_name' => 'M',
                    'last_name' => $lastName,
                    'email' => sprintf('cadet%03d@example.com', $i),
                    'password' => Hash::make('password'),
                    'student_number' => sprintf('2025-%04d', $i),
                    'role' => 'user',
                    'status' => 'approved',
                    'gender' => $gender,
                    // platoon/company/battalion will be assigned after alphabetical sorting
                ]);
            }

            // After creation, assign platoon/company/battalion deterministically
            $cadets = User::where('role', 'user')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get();

            $companies = ['Alpha','Beta','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'];

            foreach ($cadets as $index => $cadet) {
                // 0-based groups of 37
                $groupIndex = intdiv($index, 37);
                // Determine platoon within a 3-group cycle (1st, 2nd, 3rd), repeating
                $platoonCycle = $groupIndex % 3; // 0,1,2 -> 1st/2nd/3rd
                $platoon = $platoonCycle === 0 ? '1st Platoon' : ($platoonCycle === 1 ? '2nd Platoon' : '3rd Platoon');
                // Company only advances after a full set of three platoons gets filled (i.e., per 3 groups)
                $companyIndex = intdiv($groupIndex, 3); // 0.. -> Alpha, Beta, Charlie...
                $company = $companies[$companyIndex % count($companies)];
                // Battalion by gender (case-insensitive; supports 'M'/'F')
                $g = is_string($cadet->gender) ? strtolower(trim($cadet->gender)) : '';
                $battalion = $g === 'male' || $g === 'm' ? '1st Battalion' : ($g === 'female' || $g === 'f' ? '2nd Battalion' : null);

                $cadet->platoon = $platoon;
                $cadet->company = $company;
                if ($battalion !== null) {
                    $cadet->battalion = $battalion;
                }
                $cadet->save();
            }
        }
    }
}
