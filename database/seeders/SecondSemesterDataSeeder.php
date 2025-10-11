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
        $secondSemester = '2025-2026 2nd semester';
        
        // Get all users with role 'user' (cadets)
        $cadets = User::where('role', 'user')->get();
        
        foreach ($cadets as $cadet) {
            // Create merits data for second semester with empty values
            // Note: The merits table might have been renamed or changed structure
            // Check if this table still exists and has correct structure
            if (Schema::hasTable('merits')) {
                $data = [
                    'cadet_id' => $cadet->id,
                    'type' => 'military_attitude',
                    'semester' => $secondSemester,
                    'updated_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                // Add day columns if they exist
                for ($i = 1; $i <= 15; $i++) {
                    if (Schema::hasColumn('merits', "day_{$i}")) {
                        $data["day_{$i}"] = '';
                    }
                }
                
                // Add total_merits and aptitude_30 instead of percentage
                if (Schema::hasColumn('merits', 'total_merits')) {
                    $data['total_merits'] = 0;
                }
                
                if (Schema::hasColumn('merits', 'aptitude_30')) {
                    $data['aptitude_30'] = 0;
                }
                
                DB::table('merits')->insert($data);
            }
            
            // Create attendance data for second semester with empty values
            for ($week = 1; $week <= 15; $week++) {
                DB::table('second_semester_attendance')->insert([
                    'user_id' => $cadet->id,
                    'semester' => $secondSemester,
                    'week_number' => $week,
                    'is_present' => false, // Start with no attendance
                    'attendance_date' => now()->addWeeks($week),
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
