<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UserDataSeeder extends Seeder
{
    /**
     * Seed user data for all semester tables
     */
    public function run(): void
    {
        // Get all cadet users (role = 'user')
        $cadets = User::where('role', 'user')->get();
        
        if ($cadets->isEmpty()) {
            $this->command->info('No cadet users found. Please run the main seeder first.');
            return;
        }

        $this->command->info('Seeding data for ' . $cadets->count() . ' cadets...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Clear existing data
        DB::table('first_semester_aptitude')->truncate();
        DB::table('first_semester_attendance')->truncate();
        DB::table('first_semester_exam_scores')->truncate();
        DB::table('second_semester_aptitude')->truncate();
        DB::table('second_semester_attendance')->truncate();
        DB::table('second_semester_exam_scores')->truncate();

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        foreach ($cadets as $cadet) {
            $this->seedFirstSemesterAptitude($cadet);
            $this->seedFirstSemesterAttendance($cadet);
            $this->seedFirstSemesterExamScores($cadet);
            $this->seedSecondSemesterAptitude($cadet);
            $this->seedSecondSemesterAttendance($cadet);
            $this->seedSecondSemesterExamScores($cadet);
        }

        $this->command->info('User data seeding completed successfully!');
    }

    private function seedFirstSemesterAptitude($cadet)
    {
        DB::table('first_semester_aptitude')->insert([
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 1st semester',
            'merits_week_1' => rand(0, 10),
            'demerits_week_1' => rand(0, 5),
            'merits_week_2' => rand(0, 10),
            'demerits_week_2' => rand(0, 5),
            'merits_week_3' => rand(0, 10),
            'demerits_week_3' => rand(0, 5),
            'merits_week_4' => rand(0, 10),
            'demerits_week_4' => rand(0, 5),
            'merits_week_5' => rand(0, 10),
            'demerits_week_5' => rand(0, 5),
            'merits_week_6' => rand(0, 10),
            'demerits_week_6' => rand(0, 5),
            'merits_week_7' => rand(0, 10),
            'demerits_week_7' => rand(0, 5),
            'merits_week_8' => rand(0, 10),
            'demerits_week_8' => rand(0, 5),
            'merits_week_9' => rand(0, 10),
            'demerits_week_9' => rand(0, 5),
            'merits_week_10' => rand(0, 10),
            'demerits_week_10' => rand(0, 5),
            'percentage' => rand(70, 100),
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedFirstSemesterAttendance($cadet)
    {
        // Create attendance records for 10 weeks, 5 days per week
        for ($week = 1; $week <= 10; $week++) {
            for ($day = 1; $day <= 5; $day++) {
                DB::table('first_semester_attendance')->insert([
                    'user_id' => $cadet->id,
                    'day_number' => ($week - 1) * 5 + $day,
                    'is_present' => rand(0, 1), // Random attendance
                    'attendance_date' => now()->subWeeks(10 - $week)->addDays($day - 1),
                    'semester' => '2025-2026 1st semester',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedFirstSemesterExamScores($cadet)
    {
        // Check if the table has the required columns before inserting
        if (Schema::hasColumn('first_semester_exam_scores', 'user_id')) {
            DB::table('first_semester_exam_scores')->insert([
                'user_id' => $cadet->id,
                'midterm_exam' => rand(70, 100),
                'final_exam' => rand(70, 100),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedSecondSemesterAptitude($cadet)
    {
        DB::table('second_semester_aptitude')->insert([
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 2nd semester',
            'merits_week_1' => rand(0, 10),
            'demerits_week_1' => rand(0, 5),
            'merits_week_2' => rand(0, 10),
            'demerits_week_2' => rand(0, 5),
            'merits_week_3' => rand(0, 10),
            'demerits_week_3' => rand(0, 5),
            'merits_week_4' => rand(0, 10),
            'demerits_week_4' => rand(0, 5),
            'merits_week_5' => rand(0, 10),
            'demerits_week_5' => rand(0, 5),
            'merits_week_6' => rand(0, 10),
            'demerits_week_6' => rand(0, 5),
            'merits_week_7' => rand(0, 10),
            'demerits_week_7' => rand(0, 5),
            'merits_week_8' => rand(0, 10),
            'demerits_week_8' => rand(0, 5),
            'merits_week_9' => rand(0, 10),
            'demerits_week_9' => rand(0, 5),
            'merits_week_10' => rand(0, 10),
            'demerits_week_10' => rand(0, 5),
            'merits_week_11' => rand(0, 10),
            'demerits_week_11' => rand(0, 5),
            'merits_week_12' => rand(0, 10),
            'demerits_week_12' => rand(0, 5),
            'merits_week_13' => rand(0, 10),
            'demerits_week_13' => rand(0, 5),
            'merits_week_14' => rand(0, 10),
            'demerits_week_14' => rand(0, 5),
            'merits_week_15' => rand(0, 10),
            'demerits_week_15' => rand(0, 5),
            'merits_week_16' => rand(0, 10),
            'demerits_week_16' => rand(0, 5),
            'merits_week_17' => rand(0, 10),
            'demerits_week_17' => rand(0, 5),
            'merits_week_18' => rand(0, 10),
            'demerits_week_18' => rand(0, 5),
            'merits_week_19' => rand(0, 10),
            'demerits_week_19' => rand(0, 5),
            'merits_week_20' => rand(0, 10),
            'demerits_week_20' => rand(0, 5),
            'percentage' => rand(70, 100),
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedSecondSemesterAttendance($cadet)
    {
        // Create attendance records for 20 weeks, 5 days per week
        for ($week = 1; $week <= 20; $week++) {
            for ($day = 1; $day <= 5; $day++) {
                DB::table('second_semester_attendance')->insert([
                    'user_id' => $cadet->id,
                    'day_number' => ($week - 1) * 5 + $day,
                    'is_present' => rand(0, 1), // Random attendance
                    'attendance_date' => now()->addWeeks($week)->addDays($day - 1),
                    'semester' => '2025-2026 2nd semester',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedSecondSemesterExamScores($cadet)
    {
        DB::table('second_semester_exam_scores')->insert([
            'user_id' => $cadet->id,
            'midterm_exam' => rand(70, 100),
            'final_exam' => rand(70, 100),
            'semester' => '2025-2026 2nd semester',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
