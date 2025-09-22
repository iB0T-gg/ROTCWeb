<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FirstSemesterCommonGrade extends Model
{
    use HasFactory;

    protected $table = 'first_semester_common_grade_module';

    protected $fillable = [
        'user_id',
        'semester',
        'common_module_grade',
    ];
}


