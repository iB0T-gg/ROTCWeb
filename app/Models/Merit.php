<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merit extends Model
{
    use HasFactory;

    protected $fillable = [
        'cadet_id',
        'type',
        'day_1', 'day_2', 'day_3', 'day_4', 'day_5',
        'day_6', 'day_7', 'day_8', 'day_9', 'day_10',
        'day_11', 'day_12', 'day_13', 'day_14', 'day_15',
        'percentage',
        'updated_by'
    ];

    protected $casts = [
        'days_array' => 'array',
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

    // Get all day scores as array
    public function getDaysArrayAttribute()
    {
        return [
            $this->day_1, $this->day_2, $this->day_3, $this->day_4, $this->day_5,
            $this->day_6, $this->day_7, $this->day_8, $this->day_9, $this->day_10,
            $this->day_11, $this->day_12, $this->day_13, $this->day_14, $this->day_15
        ];
    }

    // Set all day scores from array
    public function setDaysArrayAttribute($days)
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->{"day_$i"} = $days[$i - 1] ?? null;
        }
    }
}
