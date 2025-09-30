<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Merit;
use App\Models\SecondSemesterMerit;

class UserObserver
{
    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // Check if the user's status was changed to 'approved' and they are a cadet
        if ($user->isDirty('status') && $user->status === 'approved' && $user->role === 'user') {
            $this->createDefaultMeritRecords($user);
        }
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // If a cadet is created with approved status, create default merit records
        if ($user->status === 'approved' && $user->role === 'user') {
            $this->createDefaultMeritRecords($user);
        }
    }

    /**
     * Create default merit records for a cadet.
     */
    private function createDefaultMeritRecords(User $user): void
    {
        // Get the fillable attributes from the Merit model
        $meritModel = new Merit();
        $fillableAttributes = $meritModel->getFillable();
        
        // Base data for merit record
        $meritValues = [
            'merits_week_1' => '10',
            'merits_week_2' => '10',
            'merits_week_3' => '10',
            'merits_week_4' => '10',
            'merits_week_5' => '10',
            'merits_week_6' => '10',
            'merits_week_7' => '10',
            'merits_week_8' => '10',
            'merits_week_9' => '10',
            'merits_week_10' => '10',
            'demerits_week_1' => '',
            'demerits_week_2' => '',
            'demerits_week_3' => '',
            'demerits_week_4' => '',
            'demerits_week_5' => '',
            'demerits_week_6' => '',
            'demerits_week_7' => '',
            'demerits_week_8' => '',
            'demerits_week_9' => '',
            'demerits_week_10' => '',
            'total_merits' => 100, // 10 weeks * 10 points
            'aptitude_30' => 30, // 100 * 0.30 = 30
            'updated_by' => 1, // System user
            'merits_array' => json_encode(array_fill(0, 10, '10')),
            'demerits_array' => json_encode(array_fill(0, 10, '')),
        ];
        
        // Filter out any attributes that aren't fillable in the Merit model
        $filteredMeritValues = array_intersect_key($meritValues, array_flip($fillableAttributes));
        
        // Create first semester merit record if it doesn't exist
        Merit::firstOrCreate(
            [
                'cadet_id' => $user->id,
                'type' => 'military_attitude',
                'semester' => '2025-2026 1st semester',
            ],
            $filteredMeritValues
        );

        // Get the fillable attributes from the SecondSemesterMerit model
        $secondMeritModel = new SecondSemesterMerit();
        $secondFillableAttributes = $secondMeritModel->getFillable();
        
        // Base data for second semester merit record
        $secondMeritValues = [
            'merits_week_1' => '10',
            'merits_week_2' => '10',
            'merits_week_3' => '10',
            'merits_week_4' => '10',
            'merits_week_5' => '10',
            'merits_week_6' => '10',
            'merits_week_7' => '10',
            'merits_week_8' => '10',
            'merits_week_9' => '10',
            'merits_week_10' => '10',
            'merits_week_11' => '10',
            'merits_week_12' => '10',
            'merits_week_13' => '10',
            'merits_week_14' => '10',
            'merits_week_15' => '10',
            'demerits_week_1' => '',
            'demerits_week_2' => '',
            'demerits_week_3' => '',
            'demerits_week_4' => '',
            'demerits_week_5' => '',
            'demerits_week_6' => '',
            'demerits_week_7' => '',
            'demerits_week_8' => '',
            'demerits_week_9' => '',
            'demerits_week_10' => '',
            'demerits_week_11' => '',
            'demerits_week_12' => '',
            'demerits_week_13' => '',
            'demerits_week_14' => '',
            'demerits_week_15' => '',
            'total_merits' => 150, // 15 weeks * 10 points
            'aptitude_30' => 30, // 150 * 0.30 = 45, but capped at 30
            'updated_by' => 1, // System user
            'merits_array' => json_encode(array_fill(0, 15, '10')),
            'demerits_array' => json_encode(array_fill(0, 15, '')),
        ];
        
        // Filter out any attributes that aren't fillable in the SecondSemesterMerit model
        $filteredSecondMeritValues = array_intersect_key($secondMeritValues, array_flip($secondFillableAttributes));
        
        // Create second semester merit record if it doesn't exist
        SecondSemesterMerit::firstOrCreate(
            [
                'cadet_id' => $user->id,
                'type' => 'military_attitude',
                'semester' => '2026-2027 2nd semester',
            ],
            $filteredSecondMeritValues
        );
    }
}