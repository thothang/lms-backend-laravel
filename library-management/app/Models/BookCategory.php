<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    // Relationships
    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'category_id');
    }

    public function ebooks(): HasMany
    {
        return $this->hasMany(Ebook::class, 'category_id');
    }

    // Get book count
    public function getBookCountAttribute(): int
    {
        return $this->books()->count();
    }

    public function getEbookCountAttribute(): int
    {
        return $this->ebooks()->count();
    }

    public function getTotalItemCountAttribute(): int
    {
        return $this->getBookCountAttribute() + $this->getEbookCountAttribute();
    }
}
