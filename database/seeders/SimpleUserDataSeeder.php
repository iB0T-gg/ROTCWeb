<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SimpleUserDataSeeder extends Seeder
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
            $this->seedSecondSemesterAptitude($cadet);
            $this->seedSecondSemesterAttendance($cadet);
            $this->seedSecondSemesterExamScores($cadet);
        }

        $this->command->info('User data seeding completed successfully!');
    }

    private function seedFirstSemesterAptitude($cadet)
    {
        // Only insert basic data that we know exists
        $data = [
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 1st semester',
            'percentage' => rand(70, 100),
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Add week columns if they exist
        for ($week = 1; $week <= 10; $week++) {
            if (Schema::hasColumn('first_semester_aptitude', 'merits_week_' . $week)) {
                $data['merits_week_' . $week] = rand(0, 10);
            }
            if (Schema::hasColumn('first_semester_aptitude', 'demerits_week_' . $week)) {
                $data['demerits_week_' . $week] = rand(0, 5);
            }
        }

        DB::table('first_semester_aptitude')->insert($data);
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

    private function seedSecondSemesterAptitude($cadet)
    {
        // Only insert basic data that we know exists
        $data = [
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 2nd semester',
            'percentage' => rand(70, 100),
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Add week columns if they exist (check up to 20 weeks)
        for ($week = 1; $week <= 20; $week++) {
            if (Schema::hasColumn('second_semester_aptitude', 'merits_week_' . $week)) {
                $data['merits_week_' . $week] = rand(0, 10);
            }
            if (Schema::hasColumn('second_semester_aptitude', 'demerits_week_' . $week)) {
                $data['demerits_week_' . $week] = rand(0, 5);
            }
        }

        DB::table('second_semester_aptitude')->insert($data);
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
