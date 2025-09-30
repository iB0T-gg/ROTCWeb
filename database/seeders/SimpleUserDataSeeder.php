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
        // Generate merit values
        $meritValues = [];
        $demeritsValues = [];
        $totalMerits = 0;
        
        for ($week = 1; $week <= 10; $week++) {
            $meritValue = rand(0, 10);
            $meritValues['merits_week_' . $week] = $meritValue;
            $totalMerits += $meritValue;
            $demeritsValues['demerits_week_' . $week] = rand(0, 5);
        }
        
        // Calculate aptitude score (30% of total possible points)
        $aptitude30 = round(($totalMerits / 100) * 30); // 10 weeks * 10 points = 100 max
        
        // Only insert basic data that we know exists
        $data = [
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 1st semester',
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        
        // Add total_merits and aptitude_30 fields
        if (Schema::hasColumn('first_semester_aptitude', 'total_merits')) {
            $data['total_merits'] = $totalMerits;
        }
        
        if (Schema::hasColumn('first_semester_aptitude', 'aptitude_30')) {
            $data['aptitude_30'] = $aptitude30;
        }
        
        // Add merit arrays
        if (Schema::hasColumn('first_semester_aptitude', 'merits_array')) {
            $data['merits_array'] = json_encode(array_values($meritValues));
        }
        
        if (Schema::hasColumn('first_semester_aptitude', 'demerits_array')) {
            $data['demerits_array'] = json_encode(array_values($demeritsValues));
        }

        // Add week columns if they exist
        for ($week = 1; $week <= 10; $week++) {
            if (Schema::hasColumn('first_semester_aptitude', 'merits_week_' . $week)) {
                $data['merits_week_' . $week] = $meritValues['merits_week_' . $week];
            }
            if (Schema::hasColumn('first_semester_aptitude', 'demerits_week_' . $week)) {
                $data['demerits_week_' . $week] = $demeritsValues['demerits_week_' . $week];
            }
        }

        DB::table('first_semester_aptitude')->insert($data);
    }

    private function seedFirstSemesterAttendance($cadet)
    {
        // Generate a random number of weeks present (between 0 and 10)
        $weeksPresent = rand(0, 10);
        
        // Calculate attendance score (30% of total possible weeks)
        $attendance30 = round(($weeksPresent / 10) * 30);
        
        // Insert aggregated attendance record (new structure)
        DB::table('first_semester_attendance')->insert([
            'user_id' => $cadet->id,
            'weeks_present' => $weeksPresent,
            'attendance_30' => $attendance30,
            'semester' => '2025-2026 1st semester',
            'attendance_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedSecondSemesterAptitude($cadet)
    {
        // Generate merit values
        $meritValues = [];
        $demeritsValues = [];
        $totalMerits = 0;
        
        // Check how many weeks are supported (up to 20)
        $maxWeeks = 0;
        for ($week = 1; $week <= 20; $week++) {
            if (Schema::hasColumn('second_semester_aptitude', 'merits_week_' . $week)) {
                $maxWeeks = $week;
            } else {
                break;
            }
        }
        
        // Generate random merit values for all weeks
        for ($week = 1; $week <= $maxWeeks; $week++) {
            $meritValue = rand(0, 10);
            $meritValues['merits_week_' . $week] = $meritValue;
            $totalMerits += $meritValue;
            $demeritsValues['demerits_week_' . $week] = rand(0, 5);
        }
        
        // Calculate aptitude score (30% of total possible points)
        $aptitude30 = round(($totalMerits / ($maxWeeks * 10)) * 30);
        
        // Only insert basic data that we know exists
        $data = [
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 2nd semester',
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        
        // Add total_merits and aptitude_30 fields
        if (Schema::hasColumn('second_semester_aptitude', 'total_merits')) {
            $data['total_merits'] = $totalMerits;
        }
        
        if (Schema::hasColumn('second_semester_aptitude', 'aptitude_30')) {
            $data['aptitude_30'] = $aptitude30;
        }
        
        // Add merit arrays
        if (Schema::hasColumn('second_semester_aptitude', 'merits_array')) {
            $data['merits_array'] = json_encode(array_values($meritValues));
        }
        
        if (Schema::hasColumn('second_semester_aptitude', 'demerits_array')) {
            $data['demerits_array'] = json_encode(array_values($demeritsValues));
        }

        // Add week columns if they exist (check up to 20 weeks)
        for ($week = 1; $week <= 20; $week++) {
            if (Schema::hasColumn('second_semester_aptitude', 'merits_week_' . $week)) {
                $data['merits_week_' . $week] = $meritValues['merits_week_' . $week];
            }
            if (Schema::hasColumn('second_semester_aptitude', 'demerits_week_' . $week)) {
                $data['demerits_week_' . $week] = $demeritsValues['demerits_week_' . $week];
            }
        }

        DB::table('second_semester_aptitude')->insert($data);
    }

    private function seedSecondSemesterAttendance($cadet)
    {
        // Generate a random number of weeks present (between 0 and 20)
        $weeksPresent = rand(0, 20);
        
        // Calculate attendance score (30% of total possible weeks)
        $attendance30 = round(($weeksPresent / 20) * 30);
        
        // Insert aggregated attendance record (new structure)
        DB::table('second_semester_attendance')->insert([
            'user_id' => $cadet->id,
            'weeks_present' => $weeksPresent,
            'attendance_30' => $attendance30,
            'semester' => '2025-2026 2nd semester',
            'attendance_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
