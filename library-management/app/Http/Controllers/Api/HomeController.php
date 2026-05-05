<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Ebook;
use App\Models\BookCategory;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    public function index()
    {
        // Cache each section separately for better invalidation
        $carouselBooks = Cache::remember('home.carousel.books', 3600, function() {
            return Book::with(['category', 'reviews'])->carousel()->get();
        });
        $carouselEbooks = Cache::remember('home.carousel.ebooks', 3600, function() {
            return Ebook::with(['category', 'author', 'reviews'])->carousel()->get();
        });

        // Hot - cache 30 minutes
        $hotBooks = Cache::remember('home.hot.books', 1800, function() {
            return Book::with(['category', 'reviews'])->hot()->latest()->take(10)->get();
        });
        $hotEbooks = Cache::remember('home.hot.ebooks', 1800, function() {
            return Ebook::with(['category', 'author', 'reviews'])->hot()->approved()->latest()->take(10)->get();
        });

        // Featured - cache 30 minutes
        $featuredBooks = Cache::remember('home.featured.books', 1800, function() {
            return Book::with(['category', 'reviews'])->featured()->latest()->take(10)->get();
        });
        $featuredEbooks = Cache::remember('home.featured.ebooks', 1800, function() {
            return Ebook::with(['category', 'author', 'reviews'])->featured()->approved()->latest()->take(10)->get();
        });

        // Free ebooks - cache 1 hour
        $freeEbooks = Cache::remember('home.free.ebooks', 3600, function() {
            return Ebook::with(['category', 'author', 'reviews'])->free()->approved()->latest()->take(8)->get();
        });

        // Categories - cache 6 hours (rarely changes)
        $categories = Cache::remember('home.categories', 21600, function() {
            return BookCategory::withCount('books', 'ebooks')
                ->orderByDesc('books_count')
                ->take(10)
                ->get();
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'carousel' => [
                    'books' => $carouselBooks,
                    'ebooks' => $carouselEbooks,
                ],
                'hot' => [
                    'books' => $hotBooks,
                    'ebooks' => $hotEbooks,
                ],
                'featured' => [
                    'books' => $featuredBooks,
                    'ebooks' => $featuredEbooks,
                ],
                'free_ebooks' => $freeEbooks,
                'categories' => $categories,
            ]
        ]);
    }
}
