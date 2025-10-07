<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AttendanceRecord extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'attendance_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'semester',
        'week_number',
        'attendance_date',
        'attendance_time',
        'is_present',
        'source',
        'import_batch_id'
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'attendance_date' => 'date',
        'attendance_time' => 'datetime:H:i:s',
        'is_present' => 'boolean',
    ];

    /**
     * Get the user that owns the attendance record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by semester.
     */
    public function scopeForSemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by week number.
     */
    public function scopeForWeek($query, $weekNumber)
    {
        return $query->where('week_number', $weekNumber);
    }

    /**
     * Get attendance records for a user in a specific semester.
     *
     * @param int $userId
     * @param string $semester
     * @return array Array of week_number => is_present
     */
    public static function getAttendanceArray($userId, $semester)
    {
        $records = self::forUser($userId)
            ->forSemester($semester)
            ->orderBy('week_number')
            ->get();

        $attendance = [];
        foreach ($records as $record) {
            $attendance[$record->week_number] = $record->is_present;
        }

        return $attendance;
    }

    /**
     * Calculate attendance statistics for a user in a semester.
     *
     * @param int $userId
     * @param string $semester
     * @param int $maxWeeks
     * @return array
     */
    public static function getAttendanceStats($userId, $semester, $maxWeeks)
    {
        $records = self::forUser($userId)->forSemester($semester)->get();
        
        $presentCount = $records->where('is_present', true)->count();
        $totalRecorded = $records->count();
        
        // Calculate percentage based on recorded weeks
        $percentage = $totalRecorded > 0 ? ($presentCount / $totalRecorded) * 100 : 0;
        
        // Calculate attendance_30 score
        $attendance30 = round($percentage * 0.30);
        
        return [
            'weeks_present' => $presentCount,
            'weeks_recorded' => $totalRecorded,
            'percentage' => round($percentage, 2),
            'attendance_30' => $attendance30,
            'max_weeks' => $maxWeeks
        ];
    }

    /**
     * Create or update attendance record for a user/week/semester.
     *
     * @param int $userId
     * @param string $semester
     * @param int $weekNumber
     * @param bool $isPresent
     * @param string $source
     * @param Carbon|null $date
     * @param string|null $time
     * @param string|null $batchId
     * @return self
     */
    public static function createOrUpdate($userId, $semester, $weekNumber, $isPresent, $source = 'manual', $date = null, $time = null, $batchId = null)
    {
        $record = self::updateOrCreate(
            [
                'user_id' => $userId,
                'semester' => $semester,
                'week_number' => $weekNumber,
            ],
            [
                'attendance_date' => $date ?: now()->toDateString(),
                'attendance_time' => $time,
                'is_present' => $isPresent,
                'source' => $source,
                'import_batch_id' => $batchId,
            ]
        );

        // Update the aggregated table
        self::updateAggregatedData($userId, $semester);

        return $record;
    }

    /**
     * Update the aggregated attendance data in the main attendance tables.
     *
     * @param int $userId
     * @param string $semester
     */
    public static function updateAggregatedData($userId, $semester)
    {
        // Get attendance stats
        $maxWeeks = strpos($semester, '1st semester') !== false ? 10 : 15;
        $stats = self::getAttendanceStats($userId, $semester, $maxWeeks);

        // Determine which model to update
        if (strpos($semester, '1st semester') !== false) {
            $attendanceModel = \App\Models\Attendance::class;
        } else {
            $attendanceModel = \App\Models\SecondSemesterAttendance::class;
        }

        // Update or create aggregated record
        $attendanceModel::updateOrCreate(
            [
                'user_id' => $userId,
                'semester' => $semester,
            ],
            [
                'weeks_present' => $stats['weeks_present'],
                'attendance_30' => $stats['attendance_30'],
                'average' => $stats['percentage'],
                'attendance_date' => now()->toDateString(),
            ]
        );
    }
}