<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Issue extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'issue_type',
        'description',
        'status',
        'reporter_type',
        'is_anonymous',
        'admin_response',
        'resolved_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_anonymous' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the user that reported the issue.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
