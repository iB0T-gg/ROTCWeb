<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\SecondSemesterMerit;

class SecondSemesterMeritsSeeder extends Seeder
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
            // Create second semester merits data with empty values
            SecondSemesterMerit::create([
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
            ]);
        }
        
        $this->command->info('Second semester merits data created successfully!');
    }
}
