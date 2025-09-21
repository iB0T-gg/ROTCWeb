<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecondSemesterExamScore extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'second_semester_exam_scores';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'midterm_exam',
        'final_exam',
        'semester'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'midterm_exam' => 'integer',
        'final_exam' => 'integer',
    ];

    /**
     * Get the user that owns the exam score.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
