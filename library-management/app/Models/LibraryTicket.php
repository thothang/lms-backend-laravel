<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class LibraryTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'purchase_date',
        'valid_from',
        'valid_to',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'valid_from' => 'date',
            'valid_to' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Check if ticket is currently valid
    public function isValid(): bool
    {
        $now = Carbon::now()->toDateString();
        return $now >= $this->valid_from && $now <= $this->valid_to;
    }

    // Get remaining days
    public function getRemainingDaysAttribute(): int
    {
        if (!$this->isValid()) {
            return 0;
        }

        return Carbon::now()->diffInDays($this->valid_to, false);
    }

    // Scopes
    public function scopeValid($query)
    {
        $now = Carbon::now()->toDateString();
        return $query->where('valid_from', '<=', $now)
                     ->where('valid_to', '>=', $now);
    }

    public function scopeExpired($query)
    {
        $now = Carbon::now()->toDateString();
        return $query->where('valid_to', '<', $now);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
