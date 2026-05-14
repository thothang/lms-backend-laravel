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
        'copy_id',
        'borrow_date',
        'actual_pickup_date',
        'due_date',
        'actual_return_date',
        'daily_fee_applied',
        'deposit_amount',
        'prepaid_amount',
        'actual_fee',
        'renew_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'borrow_date' => 'datetime',
            'actual_pickup_date' => 'datetime',
            'due_date' => 'datetime',
            'actual_return_date' => 'datetime',
            'daily_fee_applied' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'prepaid_amount' => 'decimal:2',
            'actual_fee' => 'decimal:2',
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

    // Calculate borrow fee based on calendar days
    public function calculateFee(): array
    {
        // Guard against null dates
        if (!$this->borrow_date || !$this->due_date) {
            return [
                'total_days' => 0,
                'on_time_days' => 0,
                'overdue_days' => 0,
                'borrow_fee' => 0.0,
                'deposit' => 0.0,
                'prepaid' => 0.0,
                'total_held' => 0.0,
                'refund' => 0.0,
                'extra_amount_needed' => 0.0,
            ];
        }

        $borrowDate = $this->borrow_date->startOfDay();
        $returnDate = ($this->actual_return_date ?? Carbon::now())->startOfDay();
        $dueDate = $this->due_date->startOfDay();

        // Total calendar days (Monday to Monday = 1 day, Monday to Tuesday = 2 days)
        $totalDays = $borrowDate->diffInDays($returnDate) + 1;
        
        // Calculate overdue days (Calendar days)
        $overdueDays = 0;
        if ($returnDate->greaterThan($dueDate)) {
            $overdueDays = $dueDate->diffInDays($returnDate);
        }
        
        $onTimeDays = max(1, $totalDays - $overdueDays);
        $overdueFeeMultiplier = config('library.overdue_penalty_multiplier', 1.5);
        
        // Ensure integer fees for VNĐ
        $borrowFee = round(($onTimeDays * (float)$this->daily_fee_applied) 
                   + ($overdueDays * (float)$this->daily_fee_applied * $overdueFeeMultiplier));

        $totalHeld = round((float)$this->deposit_amount + (float)$this->prepaid_amount);

        return [
            'total_days' => $totalDays,
            'on_time_days' => $onTimeDays,
            'overdue_days' => $overdueDays,
            'borrow_fee' => (float)$borrowFee,
            'deposit' => (float)$this->deposit_amount,
            'prepaid' => (float)$this->prepaid_amount,
            'total_held' => (float)$totalHeld,
            'refund' => (float)max(0, $totalHeld - $borrowFee),
            'extra_amount_needed' => (float)max(0, $borrowFee - $totalHeld),
        ];
    }

    // Check if overdue
    public function isOverdue(): bool
    {
        if (!$this->due_date) {
            return false;
        }
        return $this->status === 'active' 
            && Carbon::now()->greaterThan($this->due_date);
    }

    // Get remaining days until due
    public function getRemainingDaysAttribute(): int
    {
        if (!$this->due_date) {
            return 0;
        }
        return Carbon::now()->diffInDays($this->due_date, false);
    }

    // Check if can renew
    public function canRenew(): array
    {
        if ($this->status !== 'active') {
            return [false, 'Sách không ở trạng thái mượn'];
        }

        // Guard against null due_date
        if (!$this->due_date) {
            return [false, 'Không có ngày hạn trả'];
        }

        if ($this->isOverdue()) {
            return [false, 'Sách đã quá hạn, không thể gia hạn'];
        }

        $maxRenew = config('library.max_renew_count', 2);
        if ($this->renew_count >= $maxRenew) {
            return [false, "Đã gia hạn tối đa {$maxRenew} lần"];
        }

        // Guard against null copy/book
        if (!$this->copy || !$this->copy->book) {
            return [false, 'Không tìm thấy thông tin sách'];
        }

        // Check if there are ANY pending reservations
        $hasReservation = $this->copy->book->reservations()
            ->where('status', 'pending')
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

    // Scope: Pending pickup (chờ user đến nhận sách)
    public function scopePendingPickup($query)
    {
        return $query->where('status', 'pending_pickup');
    }

    // Check if can be picked up
    public function canBePickedUp(): bool
    {
        return $this->status === 'pending_pickup';
    }

    // Check if can be returned (chỉ khi đã active)
    public function canBeReturned(): bool
    {
        return $this->status === 'active';
    }
}
