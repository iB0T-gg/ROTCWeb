<?php
/**
 * User Model
 * 
 * This model represents users in the system and handles authentication, password resets,
 * and other user-related functionality. The User model supports three main roles:
 * - admin: System administrators with full access
 * - faculty: Faculty members with specific permissions
 * - user: Regular students/users with limited access
 * 
 * Users also have a status field that can be:
 * - approved: User is approved and can access the system
 * - pending: User registration is pending approval
 * - rejected: User registration was rejected
 */

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use App\Notifications\ResetPassword as ResetPasswordNotification;

/**
 * User Authentication Model
 * 
 * Extends Laravel's Authenticatable class to provide user authentication
 * and implements CanResetPassword to enable password reset functionality.
 */
class User extends Authenticatable implements CanResetPasswordContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, CanResetPassword;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'email',
    'student_number',
    'first_name',
    'middle_name',
    'last_name',
    'gender',
    'campus',
    'year',
    'course',
    'section',
    'password',
    'phone_number',
    'cor_file_path',
    'role',
    'status',
    'archived',
    'archived_at',
    'semester',
    'birthday',
    'age',
    'platoon',
    'company',
    'battalion',
    'blood_type',
    'region',
    'height',
    'address',
    'profile_pic',
    'equivalent_grade',
    'final_grade',
    'remarks',
];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }
    
    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->middle_name} {$this->last_name}";
    }

    /**
     * Get the combined year-course-section display.
     */
    public function getYearCourseSectionAttribute()
    {
        $result = $this->course . ' ' . $this->year;
        
        if (!empty($this->section)) {
            $result .= '-' . $this->section;
        }
        
        return $result;
    }
    
    /**
     * Get the first semester attendance records for the user.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the second semester attendance records for the user.
     */
    public function secondSemesterAttendances()
    {
        return $this->hasMany(\App\Models\SecondSemesterAttendance::class);
    }

    /**
     * Get the first semester exam scores for the user.
     */
    public function firstSemesterExamScores()
    {
        return $this->hasMany(\App\Models\ExamScore::class);
    }

    /**
     * Get the second semester exam scores for the user.
     */
    public function secondSemesterExamScores()
    {
        return $this->hasMany(\App\Models\SecondSemesterExamScore::class);
    }

    /**
     * Compute the equivalent grade for the user.
     *
     * @param float $meritPercentage
     * @param float $attendancePercentage
     * @param float|null $midtermExam
     * @param float|null $finalExam
     * @return float
     */
    public function computeEquivalentGrade($meritPercentage, $attendancePercentage, $midtermExam, $finalExam)
    {
        $merit = $meritPercentage;
        $attendance = $attendancePercentage;
        $exams = ($midtermExam !== null && $finalExam !== null)
            ? ((floatval($midtermExam) + floatval($finalExam)) / 100) * 40
            : 0;
        $totalPercentage = $merit + $attendance + $exams;

        if ($totalPercentage >= 97) return 1.00;
        if ($totalPercentage >= 94) return 1.25;
        if ($totalPercentage >= 91) return 1.5;
        if ($totalPercentage >= 88) return 1.75;
        if ($totalPercentage >= 85) return 2.00;
        if ($totalPercentage >= 82) return 2.25;
        if ($totalPercentage >= 79) return 2.50;
        if ($totalPercentage >= 76) return 2.75;
        if ($totalPercentage >= 75) return 3.00;
        return 5.00;
    }

    /**
     * Calculate the final grade percentage for the user.
     *
     * @param float $meritPercentage
     * @param float $attendancePercentage
     * @param float|null $midtermExam
     * @param float|null $finalExam
     * @return float
     */
    public function calculateFinalGrade($meritPercentage, $attendancePercentage, $midtermExam, $finalExam)
    {
        $merit = $meritPercentage;
        $attendance = $attendancePercentage;
        $exams = ($midtermExam !== null && $finalExam !== null)
            ? ((floatval($midtermExam) + floatval($finalExam)) / 100) * 40
            : 0;
        
        return $merit + $attendance + $exams;
    }

    /**
     * Get remarks based on equivalent grade.
     *
     * @param float|null $equivalentGrade
     * @return string
     */
    public function getRemarks($equivalentGrade = null)
    {
        if ($equivalentGrade === null) {
            $equivalentGrade = $this->equivalent_grade;
        }
        
        if ($equivalentGrade === null) {
            return 'No Grade';
        }
        
        $eqGrade = floatval($equivalentGrade);
        if ($eqGrade >= 1.00 && $eqGrade <= 3.00) {
            return 'Passed';
        } else {
            return 'Failed';
        }
    }

    /**
     * Update final grade, equivalent grade, and remarks for the user.
     *
     * @param float $meritPercentage
     * @param float $attendancePercentage
     * @param float|null $midtermExam
     * @param float|null $finalExam
     * @return bool
     */
    public function updateGrades($meritPercentage, $attendancePercentage, $midtermExam, $finalExam)
    {
        $finalGrade = $this->calculateFinalGrade($meritPercentage, $attendancePercentage, $midtermExam, $finalExam);
        $equivalentGrade = $this->computeEquivalentGrade($meritPercentage, $attendancePercentage, $midtermExam, $finalExam);
        $remarks = $this->getRemarks($equivalentGrade);
        
        return $this->update([
            'final_grade' => $finalGrade,
            'equivalent_grade' => $equivalentGrade,
            'remarks' => $remarks
        ]);
    }
}
