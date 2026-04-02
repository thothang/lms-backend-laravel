<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EbookPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ebook_id',
        'purchase_date',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ebook(): BelongsTo
    {
        return $this->belongsTo(Ebook::class);
    }
}
