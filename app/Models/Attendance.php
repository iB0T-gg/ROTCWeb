<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $table = 'first_semester_attendance';
    
    protected $fillable = [
        'user_id',
        'weeks_present',
        'attendance_30',
        'semester',
        'attendance_date',
        'week_1', 'week_2', 'week_3', 'week_4', 'week_5',
        'week_6', 'week_7', 'week_8', 'week_9', 'week_10',
        'week_11', 'week_12', 'week_13', 'week_14', 'week_15'
    ];

    protected $casts = [
        'week_1' => 'boolean', 'week_2' => 'boolean', 'week_3' => 'boolean',
        'week_4' => 'boolean', 'week_5' => 'boolean', 'week_6' => 'boolean',
        'week_7' => 'boolean', 'week_8' => 'boolean', 'week_9' => 'boolean',
        'week_10' => 'boolean', 'week_11' => 'boolean', 'week_12' => 'boolean',
        'week_13' => 'boolean', 'week_14' => 'boolean', 'week_15' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate and update attendance percentage based on weekly attendance
     */
    public function updateAttendancePercentage()
    {
        $presentWeeks = 0;
        for ($i = 1; $i <= 15; $i++) {
            if ($this->{"week_{$i}"}) {
                $presentWeeks++;
            }
        }
        
        $this->weeks_present = $presentWeeks;
        $this->attendance_30 = round(($presentWeeks / 15) * 30);
        $this->save();
    }
}
