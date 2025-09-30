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
            $data = [
                'cadet_id' => $cadet->id,
                'type' => 'military_attitude',
                'semester' => $secondSemester,
                'updated_by' => null,
            ];
            
            // Check which fields are available on the model
            $modelInstance = new SecondSemesterMerit();
            $fillable = $modelInstance->getFillable();
            
            // Add day fields if they're fillable
            for ($i = 1; $i <= 15; $i++) {
                $dayField = "day_{$i}";
                if (in_array($dayField, $fillable)) {
                    $data[$dayField] = '';
                }
                
                // Also check for week fields (merits_week_X)
                $meritWeekField = "merits_week_{$i}";
                if (in_array($meritWeekField, $fillable)) {
                    $data[$meritWeekField] = '';
                }
                
                $demeritWeekField = "demerits_week_{$i}";
                if (in_array($demeritWeekField, $fillable)) {
                    $data[$demeritWeekField] = '';
                }
            }
            
            // Add total_merits and aptitude_30 instead of percentage
            if (in_array('total_merits', $fillable)) {
                $data['total_merits'] = 0;
            }
            
            if (in_array('aptitude_30', $fillable)) {
                $data['aptitude_30'] = 0;
            }
            
            // Add arrays if they exist
            if (in_array('merits_array', $fillable)) {
                $data['merits_array'] = json_encode(array_fill(0, 15, ''));
            }
            
            if (in_array('demerits_array', $fillable)) {
                $data['demerits_array'] = json_encode(array_fill(0, 15, ''));
            }
            
            SecondSemesterMerit::create($data);
        }
        
        $this->command->info('Second semester merits data created successfully!');
    }
}
