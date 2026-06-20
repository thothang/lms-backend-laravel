<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointHistory extends Model
{
    protected $fillable = [
        'user_id',
        'points_changed',
        'reason',
        'reference_id',
        'reference_type',
    ];

    protected $appends = ['points'];

    public function getPointsAttribute()
    {
        return $this->points_changed;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
