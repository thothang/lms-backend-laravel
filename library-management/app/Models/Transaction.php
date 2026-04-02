<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'status',
        'payment_gateway',
        'gateway_transaction_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    // Transaction types
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_BORROW_FEE = 'borrow_fee';
    const TYPE_PENALTY = 'penalty';
    const TYPE_EBOOK_PURCHASE = 'ebook_purchase';
    const TYPE_LIBRARY_TICKET = 'library_ticket';
    const TYPE_WITHDRAWAL = 'withdrawal';
    const TYPE_DEPOSIT_HOLD = 'deposit_hold';
    const TYPE_DEPOSIT_REFUND = 'deposit_refund';

    // Transaction statuses
    const STATUS_PENDING = 'pending';
    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED = 'failed';

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Mark transaction as success and trigger related business logic
    public function markSuccess(): void
    {
        DB::transaction(function () {
            $this->update(['status' => self::STATUS_SUCCESS]);

            switch ($this->type) {
                case self::TYPE_DEPOSIT:
                    $this->user->addBalance($this->amount);
                    break;

                case self::TYPE_DEPOSIT_REFUND:
                    $this->user->addBalance($this->amount);
                    break;

                case self::TYPE_EBOOK_PURCHASE:
                    // Author gets 60%, library gets 40%
                    if (isset($this->metadata['ebook_id'])) {
                        $ebook = Ebook::find($this->metadata['ebook_id']);
                        if ($ebook) {
                            $ebook->author->addEarnings($ebook->getAuthorEarnings());
                        }
                    }
                    break;

                case self::TYPE_WITHDRAWAL:
                    // Already subtracted from earnings_balance when created
                    break;
            }
        });
    }

    // Mark transaction as failed
    public function markFailed(): void
    {
        $this->update(['status' => self::STATUS_FAILED]);

        // Refund deposit hold if failed
        if ($this->type === self::TYPE_DEPOSIT_HOLD && $this->status === self::STATUS_PENDING) {
            $this->user->addBalance($this->amount);
        }
    }

    // Check if transaction can be processed
    public function canBeProcessed(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSuccess($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
