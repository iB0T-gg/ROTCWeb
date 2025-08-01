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
    'year_course_section',
    'password',
    'phone_number',
    'cor_file_path',
    'role',
    'status',
    'birthday',
    'gender',
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
     * Get the attendance records for the user.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
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
}
