<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'book_id',
        'copy_id',
        'expected_borrow_days',
        'reservation_date',
        'expiry_date',
        'fee_paid',
        'status',
        'queue_order',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'datetime',
            'expiry_date' => 'datetime',
            'fee_paid' => 'decimal:2',
            'expected_borrow_days' => 'integer',
            'queue_order' => 'integer',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function copy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class);
    }

    // Check if expired
    public function isExpired(): bool
    {
        return $this->status === 'pending' 
            && Carbon::now()->greaterThan($this->expiry_date);
    }

    // Calculate estimated borrow fee
    public function getEstimatedBorrowFee(): float
    {
        return $this->book->getEffectiveDailyFee() * $this->expected_borrow_days;
    }

    // Calculate reservation fee (10%)
    public function getReservationFee(): float
    {
        $percent = config('library.reservation_fee_percent', 10);
        return ($this->getEstimatedBorrowFee() * $percent) / 100;
    }

    // Get queue position
    public function getQueuePositionAttribute(): int
    {
        return $this->queue_order;
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
            ->where('expiry_date', '<', Carbon::now());
    }

    public function scopeFulfilled($query)
    {
        return $query->where('status', 'fulfilled');
    }
}
