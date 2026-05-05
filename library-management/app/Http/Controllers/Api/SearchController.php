<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Ebook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Unified search for physical books and ebooks
     */
    public function index(Request $request): JsonResponse
    {
        $keyword = $request->keyword;
        $categoryId = $request->category_id;
        $type = $request->type ?? 'all'; // book, ebook, all
        $isFree = $request->has('is_free') ? $request->boolean('is_free') : null;
        $limit = $request->limit ?? 10;

        $results = [];

        // Search Physical Books
        if ($type === 'all' || $type === 'book') {
            $bookQuery = Book::with(['category', 'reviews']);

            if ($keyword) {
                $bookQuery->where(function ($q) use ($keyword) {
                    $q->where('title', 'like', "%{$keyword}%")
                      ->orWhere('author_name', 'like', "%{$keyword}%")
                      ->orWhere('publisher', 'like', "%{$keyword}%");
                });
            }

            if ($categoryId) {
                $bookQuery->where('category_id', $categoryId);
            }

            $books = $bookQuery->paginate($limit, ['*'], 'books_page');
            
            // Append type for unified processing on frontend if needed
            $books->getCollection()->transform(function ($book) {
                $book->search_type = 'book';
                // Trigger the attribute to include it in JSON
                $book->append('average_rating');
                return $book;
            });

            $results['books'] = $books;
        }

        // Search Ebooks
        if ($type === 'all' || $type === 'ebook') {
            $ebookQuery = Ebook::with(['author:id,name', 'category:id,name', 'reviews'])
                ->approved();

            if ($keyword) {
                $ebookQuery->where(function ($q) use ($keyword) {
                    $q->where('title', 'like', "%{$keyword}%")
                      ->orWhereHas('author', function ($q) use ($keyword) {
                          $q->where('name', 'like', "%{$keyword}%");
                      });
                });
            }

            if ($categoryId) {
                $ebookQuery->where('category_id', $categoryId);
            }

            if ($isFree !== null) {
                $ebookQuery->where('is_free', $isFree);
            }

            $ebooks = $ebookQuery->paginate($limit, ['*'], 'ebooks_page');
            
            $ebooks->getCollection()->transform(function ($ebook) {
                $ebook->search_type = 'ebook';
                $ebook->append('average_rating');
                return $ebook;
            });

            $results['ebooks'] = $ebooks;
        }

        return response()->json($results);
    }
}
