<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ebook extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'author_id',
        'description',
        'price',
        'file_path',
        'free_preview_pages',
        'status',
        'rejection_reason',
        'is_free',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'free_preview_pages' => 'integer',
            'is_free' => 'boolean',
        ];
    }

    // Relationships
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(EbookPurchase::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    // Check if user has purchased
    public function isPurchasedBy(User $user): bool
    {
        return $this->purchases()->where('user_id', $user->id)->exists();
    }

    // Get effective price
    public function getEffectivePrice(): float
    {
        return $this->is_free ? 0 : (float) $this->price;
    }

    // Check if can be read by user
    public function canBeReadBy(User $user): bool
    {
        // Author can always read their own ebook
        if ($this->author_id === $user->id) {
            return true;
        }

        // Check if purchased
        return $this->isPurchasedBy($user);
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

    // Get purchase count
    public function getPurchaseCountAttribute(): int
    {
        return $this->purchases()->count();
    }

    // Get author earnings (60% of price)
    public function getAuthorEarnings(): float
    {
        $percent = config('library.ebook_author_revenue_percent', 60);
        return ($this->price * $percent) / 100;
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }
}
