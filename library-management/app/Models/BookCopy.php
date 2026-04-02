<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BookCopy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'book_id',
        'barcode',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    // Relationships
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function borrowRecord(): HasOne
    {
        return $this->hasOne(BorrowRecord::class);
    }

    // Check if copy is available
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    // Check if copy is borrowed
    public function isBorrowed(): bool
    {
        return $this->status === 'borrowed';
    }

    // Get current borrow record
    public function getCurrentBorrowRecord()
    {
        return $this->borrowRecord()
            ->whereIn('status', ['active', 'overdue'])
            ->first();
    }
}
