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
        // Generate random merit values
        $meritValues = [
            'merits_week_1' => rand(0, 10),
            'merits_week_2' => rand(0, 10),
            'merits_week_3' => rand(0, 10),
            'merits_week_4' => rand(0, 10),
            'merits_week_5' => rand(0, 10),
            'merits_week_6' => rand(0, 10),
            'merits_week_7' => rand(0, 10),
            'merits_week_8' => rand(0, 10),
            'merits_week_9' => rand(0, 10),
            'merits_week_10' => rand(0, 10),
        ];
        
        // Calculate total merits
        $totalMerits = array_sum($meritValues);
        
        // Generate merits array for JSON storage
        $meritsArray = array_values($meritValues);
        
        // Generate random demerit values
        $demeritsArray = [];
        for ($i = 1; $i <= 10; $i++) {
            $demeritsArray[] = rand(0, 5);
        }
        
        // Calculate aptitude score (30% of total possible merits)
        $aptitude30 = round(($totalMerits / 100) * 30);
        
        DB::table('first_semester_aptitude')->insert([
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 1st semester',
            'merits_week_1' => $meritValues['merits_week_1'],
            'demerits_week_1' => $demeritsArray[0],
            'merits_week_2' => $meritValues['merits_week_2'],
            'demerits_week_2' => $demeritsArray[1],
            'merits_week_3' => $meritValues['merits_week_3'],
            'demerits_week_3' => $demeritsArray[2],
            'merits_week_4' => $meritValues['merits_week_4'],
            'demerits_week_4' => $demeritsArray[3],
            'merits_week_5' => $meritValues['merits_week_5'],
            'demerits_week_5' => $demeritsArray[4],
            'merits_week_6' => $meritValues['merits_week_6'],
            'demerits_week_6' => $demeritsArray[5],
            'merits_week_7' => $meritValues['merits_week_7'],
            'demerits_week_7' => $demeritsArray[6],
            'merits_week_8' => $meritValues['merits_week_8'],
            'demerits_week_8' => $demeritsArray[7],
            'merits_week_9' => $meritValues['merits_week_9'],
            'demerits_week_9' => $demeritsArray[8],
            'merits_week_10' => $meritValues['merits_week_10'],
            'demerits_week_10' => $demeritsArray[9],
            'total_merits' => $totalMerits,
            'aptitude_30' => $aptitude30,
            'updated_by' => null,
            'merits_array' => json_encode($meritsArray),
            'demerits_array' => json_encode($demeritsArray),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
        // Generate random merit values for 20 weeks
        $meritValues = [];
        $demeritsValues = [];
        
        for ($i = 1; $i <= 20; $i++) {
            $meritValues["merits_week_{$i}"] = rand(0, 10);
            $demeritsValues["demerits_week_{$i}"] = rand(0, 5);
        }
        
        // Calculate total merits
        $totalMerits = array_sum($meritValues);
        
        // Calculate aptitude score (30% of total possible merits)
        $aptitude30 = round(($totalMerits / 200) * 30);  // 20 weeks * 10 points = 200 max
        
        // Generate arrays for JSON storage
        $meritsArray = array_values($meritValues);
        $demeritsArray = array_values($demeritsValues);
        
        // Build the insert data
        $insertData = [
            'cadet_id' => $cadet->id,
            'type' => 'military_attitude',
            'semester' => '2025-2026 2nd semester',
            'total_merits' => $totalMerits,
            'aptitude_30' => $aptitude30,
            'updated_by' => null,
            'merits_array' => json_encode($meritsArray),
            'demerits_array' => json_encode($demeritsArray),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        
        // Add all merit and demerit week fields
        for ($i = 1; $i <= 20; $i++) {
            $insertData["merits_week_{$i}"] = $meritValues["merits_week_{$i}"];
            $insertData["demerits_week_{$i}"] = $demeritsValues["demerits_week_{$i}"];
        }
        
        DB::table('second_semester_aptitude')->insert($insertData);
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
