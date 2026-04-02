<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UserDebt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'paid_amount',
        'reason',
        'borrow_record_id',
        'status',
        'reminder_count',
        'last_reminder_at',
        'due_date',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'reminder_count' => 'integer',
            'last_reminder_at' => 'datetime',
            'due_date' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    // Debt reasons
    const REASON_OVERDUE_PENALTY = 'overdue_penalty';
    const REASON_LOST_BOOK_DAMAGE = 'lost_book_damage';

    // Debt statuses
    const STATUS_PENDING = 'pending';
    const STATUS_PARTIAL_PAID = 'partial_paid';
    const STATUS_PAID = 'paid';
    const STATUS_WRITTEN_OFF = 'written_off';

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function borrowRecord(): BelongsTo
    {
        return $this->belongsTo(BorrowRecord::class);
    }

    // Get remaining amount to pay
    public function getRemainingAmount(): float
    {
        return max(0, $this->amount - $this->paid_amount);
    }

    // Check if overdue
    public function isOverdue(): bool
    {
        return $this->status !== self::STATUS_PAID 
            && Carbon::now()->greaterThan($this->due_date);
    }

    // Record a payment
    public function recordPayment(float $amount): void
    {
        $this->paid_amount += $amount;
        
        if ($this->paid_amount >= $this->amount) {
            $this->status = self::STATUS_PAID;
            $this->paid_at = now();
        } else {
            $this->status = self::STATUS_PARTIAL_PAID;
        }
        
        $this->save();

        // Update user's total_debt
        $user = $this->user;
        $remainingDebt = $user->debts()
            ->where('status', '!=', self::STATUS_PAID)
            ->sum(\DB::raw('amount - paid_amount'));
        
        $user->update(['total_debt' => $remainingDebt]);
    }

    // Increment reminder count
    public function incrementReminder(): void
    {
        $this->increment('reminder_count');
        $this->update(['last_reminder_at' => now()]);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_PARTIAL_PAID]);
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotIn('status', [self::STATUS_PAID, self::STATUS_WRITTEN_OFF])
                     ->where('due_date', '<', Carbon::now());
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }
}
