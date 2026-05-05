<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\EbookController;
use App\Http\Controllers\Api\BorrowController;
use App\Http\Controllers\Api\AuthorEbookController;
use App\Http\Controllers\Api\LibrarianController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SearchController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Library Management System API Routes
| Based on document_system.md specifications
|
*/

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Authentication - Rate limited (5 attempts/min)
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});
Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);

use App\Http\Controllers\Api\HomeController;

// Home Page Complete Data
Route::get('/home', [HomeController::class, 'index']);

// Books (Public) - Default rate limit (120/min)
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/hot', [BookController::class, 'getHot']);
Route::get('/books/featured', [BookController::class, 'getFeatured']);
Route::get('/books/carousel', [BookController::class, 'getCarousel']);
Route::get('/books/{id}', [BookController::class, 'show']);
Route::get('/categories', [BookController::class, 'categories']);

// Search - Rate limited (30/min)
Route::middleware('throttle:search')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
});

// Ebooks (Public - metadata only) - Default rate limit
Route::get('/ebooks', [EbookController::class, 'index']);
Route::get('/ebooks/carousel', [EbookController::class, 'carousel']);
Route::get('/ebooks/hot', [EbookController::class, 'hot']);
Route::get('/ebooks/featured', [EbookController::class, 'featured']);
Route::get('/ebooks/{id}', [EbookController::class, 'show']);

// Public Contact Form
Route::post('/contact/submit', [LibrarianController::class, 'submitContact']);

// SePay IPN Callback (Webhook - no auth) - Strict rate limit (15/min)
Route::middleware('throttle:strict')->group(function () {
    Route::post('/sepay/ipn', [PaymentController::class, 'ipn']);
});


// ============================================
// AUTHENTICATED ROUTES (JWT Required)
// ============================================
Route::middleware('auth:api')->group(function () {
    
    // Authentication
    Route::post('/refresh-token', [AuthController::class, 'refresh']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/balance', [AuthController::class, 'balance']);

    Route::middleware('active')->group(function () {
        // Borrow Management
        Route::get('/my-borrows', [BorrowController::class, 'myBorrows']);
        Route::post('/borrow/{bookId}', [BorrowController::class, 'borrow']);
        Route::post('/borrow/{borrowId}/return', [BorrowController::class, 'returnBook']);
        Route::post('/borrow/{borrowId}/renew', [BorrowController::class, 'renew']);
        
        // Reservations
        Route::get('/my-reservations', [BorrowController::class, 'myReservations']);
        Route::post('/reservations/{bookId}', [BorrowController::class, 'reserve']);
        Route::delete('/reservation/{id}', [BorrowController::class, 'cancelReservation']);

        // Ebook User Actions
        Route::get('/my-ebooks', [EbookController::class, 'myEbooks']);
        Route::get('/ebooks/{id}/access', [EbookController::class, 'access']);
        Route::get('/ebooks/{id}/read', [EbookController::class, 'read']);
        Route::get('/ebooks/{id}/preview', [EbookController::class, 'preview']);
        Route::post('/ebooks/{id}/purchase', [EbookController::class, 'purchase']);

        // Reviews
        Route::post('/reviews/book/{bookId}', [BorrowController::class, 'reviewBook']);
        Route::post('/reviews/ebook/{ebookId}', [BorrowController::class, 'reviewEbook']);

        // Payment
        Route::post('/deposit', [PaymentController::class, 'createDepositPayment']);
        Route::post('/topup', [PaymentController::class, 'createTopupPayment']);
        Route::post('/topup/confirm', [PaymentController::class, 'confirmTopup']); // Direct confirm for sandbox testing
        Route::post('/fine', [PaymentController::class, 'createFinePayment']);
        Route::get('/payments/history', [PaymentController::class, 'getHistory']);

        // Library Ticket
        Route::post('/buy-library-ticket', [BorrowController::class, 'buyLibraryTicket']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

        // Messages
        Route::get('/messages', [MessageController::class, 'index']);
        Route::post('/messages', [MessageController::class, 'store']);
        Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    });


    // ============================================
    // AUTHOR ROUTES
    // ============================================
    Route::middleware('role:author')->prefix('author')->group(function () {
        Route::post('/ebooks', [AuthorEbookController::class, 'store']);
        Route::get('/ebooks', [AuthorEbookController::class, 'index']);
        Route::put('/ebooks/{id}', [AuthorEbookController::class, 'update']);
        Route::get('/earnings', [AuthorEbookController::class, 'earnings']);
        Route::get('/earnings-history', [AuthorEbookController::class, 'earningsHistory']);
        Route::post('/withdraw', [AuthorEbookController::class, 'withdraw']);
        Route::get('/withdraw-history', [AuthorEbookController::class, 'withdrawalHistory']);
        Route::delete('/ebooks/{id}', [AuthorEbookController::class, 'destroy']);
    });


    // ============================================
    // LIBRARIAN ROUTES
    // ============================================
    Route::middleware('role:librarian,admin')->prefix('librarian')->group(function () {
        // Book Management
        Route::post('/books', [LibrarianController::class, 'createBook']);
        Route::put('/books/{id}', [LibrarianController::class, 'updateBook']);
        Route::delete('/books/{id}', [LibrarianController::class, 'deleteBook']);
        Route::post('/books/{id}/copies', [LibrarianController::class, 'addCopy']);
        Route::delete('/copies/{id}', [LibrarianController::class, 'deleteCopy']);

        // Borrow Records
        Route::get('/borrows', [LibrarianController::class, 'getBorrows']);
        Route::get('/borrows/pending-pickup', [LibrarianController::class, 'pendingPickups']);
        Route::post('/borrows/{id}/confirm-pickup', [LibrarianController::class, 'confirmPickup']);
        Route::post('/borrows/{id}/confirm-return', [LibrarianController::class, 'confirmReturn']);
        Route::post('/borrows/{id}/cancel-pickup', [LibrarianController::class, 'cancelPickup']);

        // Ebook Upload (revenue goes to admin)
        Route::post('/ebooks', [LibrarianController::class, 'uploadEbook']);

        // Ebook Approval (Librarian with can_approve_ebook permission)
        Route::get('/ebooks/pending', [AdminController::class, 'pendingEbooks']);
        Route::post('/ebooks/{id}/approve', [AdminController::class, 'approveEbook']);
        Route::post('/ebooks/{id}/reject', [AdminController::class, 'rejectEbook']);

        // Ebook Management (Admin & Librarian)
        Route::get('/ebooks/all', [EbookController::class, 'getAll']);
        Route::put('/ebooks/{id}', [EbookController::class, 'update']);
        Route::delete('/ebooks/{id}', [EbookController::class, 'destroy']);
        Route::get('/ebooks/trashed', [EbookController::class, 'trashed']);
        Route::post('/ebooks/{id}/restore', [EbookController::class, 'restore']);
        Route::delete('/ebooks/{id}/force', [EbookController::class, 'forceDelete']);

        // Offline Borrow/Return
        Route::post('/borrow/offline', [LibrarianController::class, 'borrowOffline']);
        Route::post('/return/{borrowId}', [LibrarianController::class, 'returnOffline']);

        // Reservations
        Route::get('/reservations', [LibrarianController::class, 'reservations']);
        Route::post('/reservations/{id}/confirm', [LibrarianController::class, 'confirmReservation']);

        // Lost Books
        Route::post('/books/{copyId}/mark-lost', [LibrarianController::class, 'markLost']);

        // Hot Books Management
        Route::post('/settings/books/hot', [LibrarianController::class, 'setHotBooks']);
        Route::post('/settings/ebooks/hot', [EbookController::class, 'setHotBooks']);

        // Finance
        Route::get('/finance/summary', [LibrarianController::class, 'financeSummary']);
        Route::get('/finance/topups', [LibrarianController::class, 'topups']);
        Route::get('/finance/deposits', [LibrarianController::class, 'deposits']);
        Route::get('/finance/library-fees', [LibrarianController::class, 'libraryFees']);
        Route::get('/finance/all-topups', [PaymentController::class, 'getAllTopups']);
        Route::get('/finance/deposit-summary', [LibrarianController::class, 'depositSummary']);
        Route::get('/reports/borrow-stats', [LibrarianController::class, 'borrowStats']);
        Route::get('/reports/overview', [LibrarianController::class, 'reportsOverview']);
        Route::get('/reports/borrowings', [LibrarianController::class, 'reportsBorrowings']);
        Route::get('/reports/top-books', [LibrarianController::class, 'topBooks']);
        Route::get('/reports/category-stats', [LibrarianController::class, 'categoryStats']);
        Route::get('/reports/return-stats', [LibrarianController::class, 'returnStats']);

        // Users
        Route::get('/users/all', [LibrarianController::class, 'getUsers']);
        Route::put('/users/{id}/status', [LibrarianController::class, 'updateUserStatus']);

        // Messages
        Route::get('/messages', [LibrarianController::class, 'messages']);
        Route::post('/messages', [LibrarianController::class, 'sendMessage']);

        // Contact Messages
        Route::get('/contact-messages', [LibrarianController::class, 'getContactMessages']);
        Route::get('/contact-messages/stats', [LibrarianController::class, 'contactMessageStats']);
        Route::post('/contact-messages/{id}/reply', [LibrarianController::class, 'replyContact']);
    });


    // ============================================
    // ADMIN ROUTES
    // ============================================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // User Management
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{id}/status', [AdminController::class, 'updateUserStatus']);
        Route::post('/users/{id}/make-author', [AdminController::class, 'makeAuthor']);

        // Librarian Permissions
        Route::get('/permissions/librarians', [AdminController::class, 'getLibrarianPermissions']);
        Route::put('/permissions/librarian/{id}', [AdminController::class, 'updateLibrarianPermissions']);

        // Ebook Management
        Route::get('/ebooks/pending', [AdminController::class, 'pendingEbooks']);
        Route::post('/ebooks', [AdminController::class, 'uploadEbook']); // Admin upload ebook
        Route::post('/ebooks/{id}/approve', [AdminController::class, 'approveEbook']);
        Route::post('/ebooks/{id}/reject', [AdminController::class, 'rejectEbook']);

        // Withdrawal Requests
        Route::get('/withdraw-requests', [AdminController::class, 'withdrawalRequests']);
        Route::post('/withdraw-requests/{id}/process', [AdminController::class, 'processWithdrawal']);

        // Admin Revenue
        Route::get('/revenue', [AdminController::class, 'revenue']);
        Route::get('/deposit-summary', [AdminController::class, 'depositSummary']);
        Route::get('/borrow-stats', [AdminController::class, 'borrowStats']);

        // Ebook Earnings
        Route::get('/ebook-earnings', [AdminController::class, 'ebookEarnings']);
        Route::get('/author-earnings', [AdminController::class, 'authorEarningsSummary']);

        // Settings
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/overview', [ReportController::class, 'overview']);
            Route::get('/borrowings', [ReportController::class, 'borrowings']);
            Route::get('/revenue', [ReportController::class, 'revenue']);
        });

        // Audit Logs
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);

        // Transactions
        Route::get('/transactions', [AdminController::class, 'transactions']);
    });
});

// Broadcasting Auth (for WebSocket)
Route::post('/broadcasting/auth', function () {
    return response()->json(['channel_name' => request('channel_name')]);
})->middleware('auth:api');
