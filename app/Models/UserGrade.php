<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGrade extends Model
{
    use HasFactory;

    protected $table = 'user_grades';

    protected $fillable = [
        'user_id',
        'semester',
        'equivalent_grade',
        'remarks',
        'final_grade',
    ];

    protected $casts = [
        'equivalent_grade' => 'float',
        'final_grade' => 'integer',
    ];

    /**
     * Get the user that owns the grade.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get grades for a specific semester
     */
    public function scopeForSemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    /**
     * Calculate and update the ROTC grade based on aptitude, attendance, and exam scores
     */
    public static function calculateAndStoreGrade($userId, $semester)
    {
        $user = User::find($userId);
        
        if (!$user) {
            return null;
        }

        // Determine which semester we're working with
        $isFirstSemester = strpos($semester, '1st semester') !== false;
        
        // Get aptitude score (30%)
        $aptitudeScore = 0;
        if ($isFirstSemester) {
            $aptitude = \App\Models\Merit::where('cadet_id', $userId)
                ->where('type', 'military_attitude')
                ->first();
            $aptitudeScore = $aptitude ? $aptitude->aptitude_30 : 0;
        } else {
            $aptitude = \App\Models\SecondSemesterMerit::where('cadet_id', $userId)
                ->where('type', 'military_attitude')
                ->first();
            $aptitudeScore = $aptitude ? $aptitude->aptitude_30 : 0;
        }

        // Get attendance score (30%)
        $attendanceScore = 0;
        if ($isFirstSemester) {
            $attendance = \App\Models\Attendance::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendanceScore = $attendance ? $attendance->attendance_30 : 0;
        } else {
            $attendance = \App\Models\SecondSemesterAttendance::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            $attendanceScore = $attendance ? $attendance->attendance_30 : 0;
        }

        // Get exam score (40%)
        $examScore = 0;
        if ($isFirstSemester) {
            $exam = \App\Models\ExamScore::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            if ($exam && $exam->average) {
                $examScore = min(40, round($exam->average * 0.40));
            }
        } else {
            $exam = \App\Models\SecondSemesterExamScore::where('user_id', $userId)
                ->where('semester', $semester)
                ->first();
            if ($exam && $exam->average) {
                $examScore = min(40, round($exam->average * 0.40));
            }
        }

        // Calculate final grade (total percentage)
        $finalGrade = $aptitudeScore + $attendanceScore + $examScore;

        // Calculate equivalent grade based on the scale
        $equivalentGrade = self::calculateEquivalentGrade($finalGrade);

        // Determine remarks
        $remarks = ($equivalentGrade >= 1.00 && $equivalentGrade <= 3.00) ? 'Passed' : 'Failed';

        // Store or update the grade
        return self::updateOrCreate(
            [
                'user_id' => $userId,
                'semester' => $semester
            ],
            [
                'final_grade' => $finalGrade,
                'equivalent_grade' => $equivalentGrade,
                'remarks' => $remarks
            ]
        );
    }

    /**
     * Calculate equivalent grade based on final percentage
     */
    public static function calculateEquivalentGrade($finalGrade)
    {
        if ($finalGrade >= 96.5) return 1.00;
        if ($finalGrade >= 93.5) return 1.25;
        if ($finalGrade >= 90.5) return 1.50;
        if ($finalGrade >= 87.5) return 1.75;
        if ($finalGrade >= 84.5) return 2.00;
        if ($finalGrade >= 81.5) return 2.25;
        if ($finalGrade >= 78.5) return 2.50;
        if ($finalGrade >= 75.5) return 2.75;
        if ($finalGrade >= 75.0) return 3.00;
        return 5.00;
    }

    /**
     * Recalculate grades for all users in a semester
     */
    public static function recalculateAllGrades($semester)
    {
        $users = User::where('role', 'user')->get();
        $updated = 0;

        foreach ($users as $user) {
            $grade = self::calculateAndStoreGrade($user->id, $semester);
            if ($grade) {
                $updated++;
            }
        }

        return $updated;
    }
}