<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clear existing data and set default merits to 10
        $this->clearAndSetDefaults('first_semester_aptitude', 10);
        $this->clearAndSetDefaults('second_semester_aptitude', 15);
    }

    private function clearAndSetDefaults($tableName, $weekCount)
    {
        // Clear all existing data
        \DB::table($tableName)->truncate();
        
        // Get all cadets
        $cadets = \DB::table('users')->where('role', 'user')->where('status', 'approved')->get();
        
        // Insert default data for each cadet
        foreach ($cadets as $cadet) {
            $meritsData = [];
            $demeritsData = [];
            
            // Set merits to 10 for all weeks
            for ($i = 1; $i <= $weekCount; $i++) {
                $meritsData["merits_week_$i"] = '10';
                $demeritsData["demerits_week_$i"] = '';
            }
            
            // Determine semester based on table
            $semester = $tableName === 'first_semester_aptitude' ? '2025-2026 1st semester' : '2026-2027 2nd semester';
            
            \DB::table($tableName)->insert([
                'cadet_id' => $cadet->id,
                'type' => 'military_attitude',
                'semester' => $semester,
                ...$meritsData,
                ...$demeritsData,
                'percentage' => 30.00, // 100% of 30 points since all merits are 10
                'updated_by' => 1, // System user
                'days_array' => json_encode(array_fill(0, $weekCount, '10')),
                'demerits_array' => json_encode(array_fill(0, $weekCount, '')),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration clears data, so rollback would require restoring from backup
        // For safety, we'll leave the data as is
    }
};
