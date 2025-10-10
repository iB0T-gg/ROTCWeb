<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamScore extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'first_semester_exam_scores';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'final_exam',
        'average',
        'subj_prof_40',
        'semester'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'final_exam' => 'integer',
        'average' => 'integer',
        'subj_prof_40' => 'integer',
    ];

    /**
     * Get the user that owns the exam score.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
