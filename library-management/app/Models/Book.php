<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Book extends Model
{
    use HasFactory, SoftDeletes;
 
    protected $appends = ['average_rating'];

    protected $fillable = [
        'title',
        'author_name',
        'publisher',
        'category_id',
        'description',
        'cover_image',
        'price',
        'daily_fee',
        'is_hot',
        'is_featured',
        'in_carousel',
        'carousel_order',
        'total_copies',
        'available_copies',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'daily_fee' => 'decimal:2',
            'is_hot' => 'boolean',
            'is_featured' => 'boolean',
            'in_carousel' => 'boolean',
            'carousel_order' => 'integer',
            'total_copies' => 'integer',
            'available_copies' => 'integer',
        ];
    }

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class);
    }

    public function copies(): HasMany
    {
        return $this->hasMany(BookCopy::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    // Get daily fee (use book-specific or default)
    public function getEffectiveDailyFee(): float
    {
        if ($this->daily_fee !== null) {
            return (float) $this->daily_fee;
        }

        return (float) config('library.default_daily_fee', 5000);
    }

    // Get deposit amount
    public function getDepositAmount(): float
    {
        $percent = config('library.deposit_percent', 50);
        $maxDeposit = config('library.max_deposit_amount', 300000);
        
        $deposit = ($this->price * $percent) / 100;
        
        return min($deposit, $maxDeposit);
    }

    // Update available copies from book_copies
    public function updateAvailableCopies(): void
    {
        $availableCount = $this->copies()
            ->where('status', 'available')
            ->count();

        $totalCount = $this->copies()->count();

        $this->update([
            'available_copies' => $availableCount,
            'total_copies' => $totalCount,
        ]);
    }

    // Check if book has available copies
    public function hasAvailableCopies(): bool
    {
        return $this->available_copies > 0;
    }

    // Get average rating
    public function getAverageRatingAttribute(): ?float
    {
        $reviews = $this->reviews;
        
        if ($reviews->isEmpty()) {
            return null;
        }

        return round($reviews->avg('rating'), 1);
    }

    // Get hot books
    public function scopeHot($query)
    {
        return $query->where('is_hot', true);
    }

    // Get featured books
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Get carousel books
    public function scopeCarousel($query)
    {
        return $query->where('in_carousel', true)
            ->orderBy('carousel_order');
    }
    public function getCoverImageAttribute($value)
    {
        if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
            return asset('storage/' . ltrim($value, '/'));
        }
        return $value;
    }
}
