<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class BorrowRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guest_name',
        'guest_phone',
        'guest_cccd',
        'copy_id',
        'borrow_date',
        'due_date',
        'return_date',
        'daily_fee_applied',
        'deposit_amount',
        'renew_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'borrow_date' => 'date',
            'due_date' => 'date',
            'return_date' => 'date',
            'daily_fee_applied' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'renew_count' => 'integer',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function copy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class);
    }

    public function debts(): HasMany
    {
        return $this->hasMany(UserDebt::class);
    }

    // Calculate borrow fee based on actual days
    public function calculateFee(): array
    {
        $returnDate = $this->return_date ?? Carbon::now();
        $totalDays = $this->borrow_date->diffInDays($returnDate) + 1;
        
        $overdueDays = max(0, Carbon::now()->diffInDays($this->due_date, false));
        // Calculate overdue days
        if ($returnDate->greaterThan($this->due_date)) {
            $overdueDays = $this->due_date->diffInDays($returnDate);
        } else {
            $overdueDays = 0;
        }
        
        $onTimeDays = $totalDays - $overdueDays;
        $overdueFeeMultiplier = config('library.overdue_penalty_multiplier', 1.5);
        
        $borrowFee = ($onTimeDays * $this->daily_fee_applied) 
                   + ($overdueDays * $this->daily_fee_applied * $overdueFeeMultiplier);

        return [
            'total_days' => $totalDays,
            'on_time_days' => $onTimeDays,
            'overdue_days' => $overdueDays,
            'borrow_fee' => $borrowFee,
            'deposit' => $this->deposit_amount,
            'refund' => max(0, $this->deposit_amount - $borrowFee),
            'extra_amount_needed' => max(0, $borrowFee - $this->deposit_amount),
        ];
    }

    // Check if overdue
    public function isOverdue(): bool
    {
        return $this->status === 'active' 
            && Carbon::now()->greaterThan($this->due_date);
    }

    // Get remaining days until due
    public function getRemainingDaysAttribute(): int
    {
        return Carbon::now()->diffInDays($this->due_date, false);
    }

    // Check if can renew
    public function canRenew(): array
    {
        if ($this->status !== 'active') {
            return [false, 'Sách không ở trạng thái mượn'];
        }

        if ($this->isOverdue()) {
            return [false, 'Sách đã quá hạn, không thể gia hạn'];
        }

        $maxRenew = config('library.max_renew_count', 2);
        if ($this->renew_count >= $maxRenew) {
            return [false, "Đã gia hạn tối đa {$maxRenew} lần"];
        }

        // Check if there are pending reservations
        $hasReservation = $this->copy->book->reservations()
            ->where('status', 'pending')
            ->where('queue_order', '<', function ($query) {
                $query->select('queue_order')
                    ->from('reservations')
                    ->whereColumn('book_id', 'reservations.book_id')
                    ->where('user_id', $this->user_id)
                    ->where('status', 'pending');
            })
            ->exists();

        if ($hasReservation) {
            return [false, 'Có người đặt trước, không thể gia hạn'];
        }

        return [true, 'Có thể gia hạn'];
    }

    // Get book title through copy
    public function getBookTitleAttribute(): ?string
    {
        return $this->copy?->book?->title;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'active')
            ->where('due_date', '<', Carbon::now());
    }

    public function scopeReturned($query)
    {
        return $query->where('status', 'returned');
    }
}
