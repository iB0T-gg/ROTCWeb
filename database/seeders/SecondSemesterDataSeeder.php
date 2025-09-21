<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class SecondSemesterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $secondSemester = '2026-2027 2nd semester';
        
        // Get all users with role 'user' (cadets)
        $cadets = User::where('role', 'user')->get();
        
        foreach ($cadets as $cadet) {
            // Create merits data for second semester with empty values
            DB::table('merits')->insert([
                'cadet_id' => $cadet->id,
                'type' => 'military_attitude',
                'semester' => $secondSemester,
                'day_1' => '',
                'day_2' => '',
                'day_3' => '',
                'day_4' => '',
                'day_5' => '',
                'day_6' => '',
                'day_7' => '',
                'day_8' => '',
                'day_9' => '',
                'day_10' => '',
                'day_11' => '',
                'day_12' => '',
                'day_13' => '',
                'day_14' => '',
                'day_15' => '',
                'percentage' => 0,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Create attendance data for second semester with empty values
            for ($day = 1; $day <= 15; $day++) {
                DB::table('attendances')->insert([
                    'user_id' => $cadet->id,
                    'semester' => $secondSemester,
                    'day_number' => $day,
                    'is_present' => false, // Start with no attendance
                    'attendance_date' => now()->addDays($day),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Update user with second semester exam scores (empty)
            $cadet->update([
                'semester' => $secondSemester,
                'midterm_exam' => null,
                'final_exam' => null,
            ]);
        }
        
        $this->command->info('Second semester data created successfully!');
    }
}
