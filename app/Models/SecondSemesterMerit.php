<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecondSemesterMerit extends Model
{
    use HasFactory;

    protected $table = 'second_semester_aptitude';

    protected $fillable = [
        'cadet_id',
        'type',
        'semester',
        'merits_week_1', 'demerits_week_1', 'merits_week_2', 'demerits_week_2', 'merits_week_3', 'demerits_week_3',
        'merits_week_4', 'demerits_week_4', 'merits_week_5', 'demerits_week_5', 'merits_week_6', 'demerits_week_6',
        'merits_week_7', 'demerits_week_7', 'merits_week_8', 'demerits_week_8', 'merits_week_9', 'demerits_week_9',
        'merits_week_10', 'demerits_week_10', 'merits_week_11', 'demerits_week_11', 'merits_week_12', 'demerits_week_12',
        'merits_week_13', 'demerits_week_13', 'merits_week_14', 'demerits_week_14', 'merits_week_15', 'demerits_week_15',
        'percentage',
        'updated_by',
        'days_array',
        'demerits_array'
    ];

    protected $casts = [
        'days_array' => 'array',
        'demerits_array' => 'array',
    ];

    // Relationship with cadet
    public function cadet()
    {
        return $this->belongsTo(User::class, 'cadet_id');
    }

    // Relationship with faculty who updated
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Get all week scores as array
    public function getDaysArrayAttribute()
    {
        return [
            $this->merits_week_1 === null || $this->merits_week_1 === '' ? '-' : $this->merits_week_1,
            $this->merits_week_2 === null || $this->merits_week_2 === '' ? '-' : $this->merits_week_2,
            $this->merits_week_3 === null || $this->merits_week_3 === '' ? '-' : $this->merits_week_3,
            $this->merits_week_4 === null || $this->merits_week_4 === '' ? '-' : $this->merits_week_4,
            $this->merits_week_5 === null || $this->merits_week_5 === '' ? '-' : $this->merits_week_5,
            $this->merits_week_6 === null || $this->merits_week_6 === '' ? '-' : $this->merits_week_6,
            $this->merits_week_7 === null || $this->merits_week_7 === '' ? '-' : $this->merits_week_7,
            $this->merits_week_8 === null || $this->merits_week_8 === '' ? '-' : $this->merits_week_8,
            $this->merits_week_9 === null || $this->merits_week_9 === '' ? '-' : $this->merits_week_9,
            $this->merits_week_10 === null || $this->merits_week_10 === '' ? '-' : $this->merits_week_10,
            $this->merits_week_11 === null || $this->merits_week_11 === '' ? '-' : $this->merits_week_11,
            $this->merits_week_12 === null || $this->merits_week_12 === '' ? '-' : $this->merits_week_12,
            $this->merits_week_13 === null || $this->merits_week_13 === '' ? '-' : $this->merits_week_13,
            $this->merits_week_14 === null || $this->merits_week_14 === '' ? '-' : $this->merits_week_14,
            $this->merits_week_15 === null || $this->merits_week_15 === '' ? '-' : $this->merits_week_15
        ];
    }

    // Set all week scores from array
    public function setDaysArrayAttribute($days)
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->{"merits_week_$i"} = $days[$i - 1] ?? null;
        }
    }

    // Get all demerits week scores as array
    public function getDemeritsArrayAttribute()
    {
        return [
            $this->demerits_week_1 === null || $this->demerits_week_1 === '' ? '-' : $this->demerits_week_1,
            $this->demerits_week_2 === null || $this->demerits_week_2 === '' ? '-' : $this->demerits_week_2,
            $this->demerits_week_3 === null || $this->demerits_week_3 === '' ? '-' : $this->demerits_week_3,
            $this->demerits_week_4 === null || $this->demerits_week_4 === '' ? '-' : $this->demerits_week_4,
            $this->demerits_week_5 === null || $this->demerits_week_5 === '' ? '-' : $this->demerits_week_5,
            $this->demerits_week_6 === null || $this->demerits_week_6 === '' ? '-' : $this->demerits_week_6,
            $this->demerits_week_7 === null || $this->demerits_week_7 === '' ? '-' : $this->demerits_week_7,
            $this->demerits_week_8 === null || $this->demerits_week_8 === '' ? '-' : $this->demerits_week_8,
            $this->demerits_week_9 === null || $this->demerits_week_9 === '' ? '-' : $this->demerits_week_9,
            $this->demerits_week_10 === null || $this->demerits_week_10 === '' ? '-' : $this->demerits_week_10,
            $this->demerits_week_11 === null || $this->demerits_week_11 === '' ? '-' : $this->demerits_week_11,
            $this->demerits_week_12 === null || $this->demerits_week_12 === '' ? '-' : $this->demerits_week_12,
            $this->demerits_week_13 === null || $this->demerits_week_13 === '' ? '-' : $this->demerits_week_13,
            $this->demerits_week_14 === null || $this->demerits_week_14 === '' ? '-' : $this->demerits_week_14,
            $this->demerits_week_15 === null || $this->demerits_week_15 === '' ? '-' : $this->demerits_week_15
        ];
    }

    // Set all demerits week scores from array
    public function setDemeritsArrayAttribute($demerits)
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->{"demerits_week_$i"} = $demerits[$i - 1] ?? null;
        }
    }
}
