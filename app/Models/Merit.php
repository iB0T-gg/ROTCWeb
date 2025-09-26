<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merit extends Model
{
    use HasFactory;

    protected $table = 'first_semester_aptitude';

    protected $fillable = [
        'cadet_id',
        'type',
        'semester',
        'merits_week_1', 'demerits_week_1', 'merits_week_2', 'demerits_week_2', 'merits_week_3', 'demerits_week_3',
        'merits_week_4', 'demerits_week_4', 'merits_week_5', 'demerits_week_5', 'merits_week_6', 'demerits_week_6',
        'merits_week_7', 'demerits_week_7', 'merits_week_8', 'demerits_week_8', 'merits_week_9', 'demerits_week_9',
        'merits_week_10', 'demerits_week_10',
        'total_merits',
        'aptitude_30',
        'updated_by',
        'merits_array',
        'demerits_array'
    ];

    protected $casts = [
        'merits_array' => 'array',
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

    // Get all week scores as array (first semester has 10 weeks)
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
            $this->merits_week_10 === null || $this->merits_week_10 === '' ? '-' : $this->merits_week_10
        ];
    }

    // Set all week scores from array (first semester has 10 weeks)
    public function setDaysArrayAttribute($days)
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->{"merits_week_$i"} = $days[$i - 1] ?? null;
        }
    }

    // Get all demerits week scores as array (first semester has 10 weeks)
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
            $this->demerits_week_10 === null || $this->demerits_week_10 === '' ? '-' : $this->demerits_week_10
        ];
    }

    // Set all demerits week scores from array (first semester has 10 weeks)
    public function setDemeritsArrayAttribute($demerits)
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->{"demerits_week_$i"} = $demerits[$i - 1] ?? null;
        }
    }
}
