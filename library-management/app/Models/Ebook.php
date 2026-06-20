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
    protected $appends = ['average_rating', 'discount_info'];
    protected $with = ['reviews'];

    protected $fillable = [
        'title',
        'author_id',
        'author_name', // Tên tác giả (cho ebook của admin/thủ thư)
        'category_id',
        'description',
        'cover_image',
        'price',
        'file_path',
        'free_preview_pages',
        'status',
        'rejection_reason',
        'is_free',
        'uploaded_by_admin', // Đánh dấu ebook do admin/thủ thư đăng
        'is_hot', // Ebook hot
        'is_featured', // Ebook nổi bật
        'in_carousel', // Ebook trong carousel
        'carousel_order', // Thứ tự carousel
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'category_id' => 'integer',
            'free_preview_pages' => 'integer',
            'is_free' => 'boolean',
            'is_hot' => 'boolean',
            'is_featured' => 'boolean',
            'in_carousel' => 'boolean',
            'carousel_order' => 'integer',
        ];
    }

    // Relationships
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class, 'category_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(EbookPurchase::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
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

        // Free ebooks can be read by any authenticated user
        if ($this->is_free) {
            return true;
        }

        // Check if purchased (for paid ebooks)
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

    // Get discount info based on active promotions
    public function getDiscountInfoAttribute()
    {
        if ($this->is_free || !$this->price) {
            return null;
        }

        $promotions = \Illuminate\Support\Facades\Cache::remember('active_promotions', 60, function() {
            return \App\Models\Promotion::active()->get();
        });

        $bestDiscountAmount = 0;
        $bestPromotion = null;

        foreach ($promotions as $promo) {
            $applies = false;
            
            if ($promo->target_type === 'all_ebooks') {
                $applies = true;
            } elseif ($promo->target_type === 'category') {
                $ids = is_string($promo->target_ids) ? json_decode($promo->target_ids, true) : $promo->target_ids;
                if (is_array($ids) && in_array($this->category_id, $ids)) {
                    $applies = true;
                }
            } elseif ($promo->target_type === 'specific_ebooks') {
                $ids = is_string($promo->target_ids) ? json_decode($promo->target_ids, true) : $promo->target_ids;
                if (is_array($ids) && in_array($this->id, $ids)) {
                    $applies = true;
                }
            }

            if ($applies) {
                $discountAmount = $promo->discount_type === 'percent'
                    ? ($this->price * $promo->discount_value / 100)
                    : $promo->discount_value;
                
                if ($discountAmount > $bestDiscountAmount) {
                    $bestDiscountAmount = $discountAmount;
                    $bestPromotion = $promo;
                }
            }
        }

        if (!$bestPromotion || $bestDiscountAmount <= 0) {
            return null;
        }

        $bestDiscountAmount = min($bestDiscountAmount, $this->price);
        $discountedPrice = max(0, $this->price - $bestDiscountAmount);
        $discountPercent = $bestPromotion->discount_type === 'percent'
            ? $bestPromotion->discount_value
            : round(($bestDiscountAmount / $this->price) * 100);

        return [
            'original_price' => (float)$this->price,
            'discounted_price' => (float)$discountedPrice,
            'discount_amount' => (float)$bestDiscountAmount,
            'discount_percent' => (float)$discountPercent,
            'promotion_name' => $bestPromotion->name,
        ];
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

    // Scope: Hot ebooks
    public function scopeHot($query)
    {
        return $query->where('is_hot', true);
    }

    // Scope: Featured ebooks
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Scope: Carousel ebooks
    public function scopeCarousel($query)
    {
        return $query->where('in_carousel', true)
            ->orderBy('carousel_order');
    }

    // Search ebooks
    public function scopeSearch($query, $keyword)
    {
        if (empty($keyword)) return $query;
        return $query->where(function($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('author_name', 'like', "%{$keyword}%")
              ->orWhereHas('author', function($aq) use ($keyword) {
                  $aq->where('name', 'like', "%{$keyword}%");
              });
        });
    }

    public function getCoverImageAttribute($value)
    {
        if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
            return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
        }
        return $value;
    }
}
