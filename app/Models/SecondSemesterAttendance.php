<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecondSemesterAttendance extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'second_semester_attendance';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'semester',
        'attendance_date',
        'weeks_present',
        'attendance_30'
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attendance_date' => 'date',
        'weeks_present' => 'integer',
        'attendance_30' => 'integer',
    ];

    /**
     * Get the user that owns the attendance record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
