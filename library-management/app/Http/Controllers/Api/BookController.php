<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BookController extends Controller
{
    /**
     * Get list of books with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Book::with('category');

        // Filter by keyword
        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                  ->orWhere('author_name', 'like', "%{$keyword}%")
                  ->orWhere('publisher', 'like', "%{$keyword}%");
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by author
        if ($request->has('author')) {
            $query->where('author_name', 'like', "%{$request->author}%");
        }

        // Filter by availability
        if ($request->status === 'available') {
            $query->where('available_copies', '>', 0);
        }

        // Sort
        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        
        if ($sort === 'popular') {
            // Sort by borrow count (we'll implement this later with analytics)
            $query->orderBy('created_at', 'desc');
        } else {
            $query->orderBy($sort, $order);
        }

        // Pagination
        $perPage = $request->limit ?? 20;
        $books = $query->paginate($perPage);

        $books->getCollection()->transform(function ($book) {
            return $book;
        });

        return response()->json($books);
    }

    /**
     * Get hot books
     */
    public function getHot(): JsonResponse
    {
        $books = Cache::remember('books.hot', 1800, function() {
            return Book::hot()
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        return response()->json([
            'data' => $books,
        ]);
    }

    /**
     * Get featured books
     */
    public function getFeatured(): JsonResponse
    {
        $books = Cache::remember('books.featured', 1800, function() {
            return Book::featured()
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        return response()->json([
            'data' => $books,
        ]);
    }

    /**
     * Get carousel books
     */
    public function getCarousel(): JsonResponse
    {
        $books = Cache::remember('books.carousel', 3600, function() {
            return Book::carousel()
                ->with('category')
                ->get();
        });

        return response()->json([
            'data' => $books,
        ]);
    }

    /**
     * Get book details with reviews
     */
    public function show(int $id): JsonResponse
    {
        $book = Cache::remember("books.show.{$id}", 900, function() use ($id) {
            $book = Book::with([
                'category',
                'copies' => function ($query) {
                    $query->where('status', 'available');
                },
                'reviews' => function ($query) {
                    $query->with('user:id,name')
                        ->orderBy('created_at', 'desc')
                        ->limit(10);
                },
            ])
            ->withCount(['reservations' => function ($query) {
                $query->where('status', 'pending');
            }])
            ->find($id);

            if (!$book) {
                return null;
            }

            $book->total_reviews = $book->reviews->count();
            return $book;
        });

        if (!$book) {
            return response()->json([
                'error' => 'Sách không tồn tại',
            ], 404);
        }

        return response()->json($book);
    }

    /**
     * Get all categories
     */
    public function categories(): JsonResponse
    {
        $categories = Cache::remember('books.categories', 21600, function() {
            return BookCategory::withCount('books')
                ->orderBy('name')
                ->get();
        });

        return response()->json([
            'data' => $categories,
        ]);
    }
}
