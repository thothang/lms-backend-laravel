<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use App\Models\Book;
use App\Models\Ebook;
use App\Models\BookCategory;
use App\Models\User;
use App\Models\BorrowRecord;
use App\Models\EbookPurchase;
use App\Models\Reservation;
use Carbon\Carbon;

class CacheWarmup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cache-warmup {--all : Warmup all caches} {--books : Warmup book caches} {--ebooks : Warmup ebook caches} {--home : Warmup home page caches} {--reports : Warmup report caches}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warmup all necessary caches for the library management system';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting cache warmup...');

        $start = microtime(true);

        if ($this->option('all') || $this->option('books')) {
            $this->warmupBooks();
        }

        if ($this->option('all') || $this->option('ebooks')) {
            $this->warmupEbooks();
        }

        if ($this->option('all') || $this->option('home')) {
            $this->warmupHome();
        }

        if ($this->option('all') || $this->option('reports')) {
            $this->warmupReports();
        }

        $duration = round(microtime(true) - $start, 2);
        $this->info("Cache warmup completed in {$duration} seconds.");

        return self::SUCCESS;
    }

    /**
     * Warmup book caches
     */
    private function warmupBooks()
    {
        $this->info('Warming up book caches...');

        // books.carousel - 3600s
        $this->info('  - books.carousel');
        Cache::remember('books.carousel', 3600, function() {
            return Book::with('category')->carousel()->get();
        });

        // books.hot - 1800s
        $this->info('  - books.hot');
        Cache::remember('books.hot', 1800, function() {
            return Book::hot()
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        // books.featured - 1800s
        $this->info('  - books.featured');
        Cache::remember('books.featured', 1800, function() {
            return Book::featured()
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        // Warmup cache for popular books (top 20 by borrow count)
        $this->info('  - books.show.{id} (popular books)');
        $popularBooks = BorrowRecord::select('book_copies.book_id')
            ->join('book_copies', 'borrow_records.copy_id', '=', 'book_copies.id')
            ->selectRaw('COUNT(*) as borrow_count')
            ->groupBy('book_copies.book_id')
            ->orderBy('borrow_count', 'desc')
            ->limit(20)
            ->pluck('book_copies.book_id');

        foreach ($popularBooks as $bookId) {
            Cache::remember("books.show.{$bookId}", 900, function() use ($bookId) {
                return Book::with([
                    'category',
                    'copies' => function ($query) {
                        $query->where('status', 'available');
                    },
                    'reviews' => function ($query) {
                        $query->latest()->limit(10);
                    },
                    'reviews.user:id,name'
                ])->find($bookId);
            });
        }

        $this->info('Book caches warmed up successfully.');
    }

    /**
     * Warmup ebook caches
     */
    private function warmupEbooks()
    {
        $this->info('Warming up ebook caches...');

        // ebooks.carousel - 3600s
        $this->info('  - ebooks.carousel');
        Cache::remember('ebooks.carousel', 3600, function() {
            return Ebook::with(['author:id,name', 'category:id,name'])
                ->approved()
                ->where('in_carousel', true)
                ->orderBy('carousel_order', 'asc')
                ->get();
        });

        // ebooks.hot - 1800s
        $this->info('  - ebooks.hot');
        Cache::remember('ebooks.hot', 1800, function() {
            return Ebook::with(['author:id,name', 'category:id,name'])
                ->approved()
                ->where('is_hot', true)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        // ebooks.featured - 1800s
        $this->info('  - ebooks.featured');
        Cache::remember('ebooks.featured', 1800, function() {
            return Ebook::with(['author:id,name', 'category:id,name'])
                ->approved()
                ->where('is_featured', true)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        });

        $this->info('Ebook caches warmed up successfully.');
    }

    /**
     * Warmup home page caches
     */
    private function warmupHome()
    {
        $this->info('Warming up home page caches...');

        // home.carousel.books - 3600s
        $this->info('  - home.carousel.books');
        Cache::remember('home.carousel.books', 3600, function() {
            return Book::with(['category', 'reviews'])->carousel()->get();
        });

        // home.carousel.ebooks - 3600s
        $this->info('  - home.carousel.ebooks');
        Cache::remember('home.carousel.ebooks', 3600, function() {
            return Ebook::with(['category', 'author', 'reviews'])->carousel()->get();
        });

        // home.hot.books - 1800s
        $this->info('  - home.hot.books');
        Cache::remember('home.hot.books', 1800, function() {
            return Book::with(['category', 'reviews'])->hot()->latest()->take(10)->get();
        });

        // home.hot.ebooks - 1800s
        $this->info('  - home.hot.ebooks');
        Cache::remember('home.hot.ebooks', 1800, function() {
            return Ebook::with(['category', 'author', 'reviews'])->hot()->approved()->latest()->take(10)->get();
        });

        // home.featured.books - 1800s
        $this->info('  - home.featured.books');
        Cache::remember('home.featured.books', 1800, function() {
            return Book::with(['category', 'reviews'])->featured()->latest()->take(10)->get();
        });

        // home.featured.ebooks - 1800s
        $this->info('  - home.featured.ebooks');
        Cache::remember('home.featured.ebooks', 1800, function() {
            return Ebook::with(['category', 'author', 'reviews'])->featured()->approved()->latest()->take(10)->get();
        });

        // home.free.ebooks - 3600s
        $this->info('  - home.free.ebooks');
        Cache::remember('home.free.ebooks', 3600, function() {
            return Ebook::with(['category', 'author', 'reviews'])->free()->approved()->latest()->take(8)->get();
        });

        // home.categories - 21600s
        $this->info('  - home.categories');
        Cache::remember('home.categories', 21600, function() {
            return BookCategory::withCount('books', 'ebooks')
                ->orderBy('name', 'asc')
                ->get();
        });

        $this->info('Home page caches warmed up successfully.');
    }

    /**
     * Warmup report caches
     */
    private function warmupReports()
    {
        $this->info('Warming up report caches...');

        // reports.overview - 300s
        $this->info('  - reports.overview');
        Cache::remember('reports.overview', 300, function() {
            $today = Carbon::now()->startOfDay();
            $thisMonth = Carbon::now()->startOfMonth();

            // === USERS ===
            $totalUsers = User::count();
            $newUsersToday = User::where('created_at', '>=', $today)->count();
            $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

            // === BOOKS ===
            $totalBooks = Book::count();
            $totalBookCopies = \App\Models\BookCopy::count();
            $availableBookCopies = \App\Models\BookCopy::where('status', 'available')->count();

            // === EBOOKS ===
            $totalEbooks = Ebook::count();
            $approvedEbooks = Ebook::where('status', 'approved')->count();

            // === BORROWS ===
            $totalBorrows = BorrowRecord::count();
            $activeBorrows = BorrowRecord::where('status', 'active')->count();
            $overdueBorrows = BorrowRecord::where('status', 'overdue')->count();
            $borrowsToday = BorrowRecord::where('created_at', '>=', $today)->count();
            $borrowsThisMonth = BorrowRecord::where('created_at', '>=', $thisMonth)->count();

            // === EBOOK PURCHASES ===
            $totalEbookPurchases = EbookPurchase::count();
            $ebookPurchasesToday = EbookPurchase::where('created_at', '>=', $today)->count();
            $ebookPurchasesThisMonth = EbookPurchase::where('created_at', '>=', $thisMonth)->count();

            // === RESERVATIONS ===
            $totalReservations = Reservation::count();
            $pendingReservations = Reservation::where('status', 'pending')->count();

            return [
                'users' => [
                    'total' => $totalUsers,
                    'new_today' => $newUsersToday,
                    'new_this_month' => $newUsersThisMonth,
                ],
                'books' => [
                    'total' => $totalBooks,
                    'total_copies' => $totalBookCopies,
                    'available_copies' => $availableBookCopies,
                ],
                'ebooks' => [
                    'total' => $totalEbooks,
                    'approved' => $approvedEbooks,
                ],
                'borrows' => [
                    'total' => $totalBorrows,
                    'active' => $activeBorrows,
                    'overdue' => $overdueBorrows,
                    'today' => $borrowsToday,
                    'this_month' => $borrowsThisMonth,
                ],
                'ebook_purchases' => [
                    'total' => $totalEbookPurchases,
                    'today' => $ebookPurchasesToday,
                    'this_month' => $ebookPurchasesThisMonth,
                ],
                'reservations' => [
                    'total' => $totalReservations,
                    'pending' => $pendingReservations,
                ],
            ];
        });

        $this->info('Report caches warmed up successfully.');
    }
}
