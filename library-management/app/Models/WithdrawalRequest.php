<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'amount',
        'bank_account_info',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'bank_account_info' => 'array',
        ];
    }

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COMPLETED = 'completed';

    // Relationships
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Check if requires admin approval
    public function requiresAdminApproval(): bool
    {
        $threshold = config('library.author_withdrawal_threshold_percent', 70);
        $author = $this->author;
        
        // If withdrawal amount > 70% of total_earned, needs admin approval
        return ($this->amount / $author->total_earned) > ($threshold / 100);
    }

    // Check if can be processed
    public function canBeProcessed(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    // Approve the withdrawal
    public function approve(string $notes = null): void
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'admin_notes' => $notes,
        ]);
    }

    // Reject the withdrawal
    public function reject(string $notes = null): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'admin_notes' => $notes,
        ]);

        // Refund the amount to author's earnings_balance
        $this->author->addEarnings($this->amount);
    }

    // Mark as completed
    public function markCompleted(): void
    {
        $this->update(['status' => self::STATUS_COMPLETED]);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }
}
