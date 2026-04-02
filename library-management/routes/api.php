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

// Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Books (Public)
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/hot', [BookController::class, 'getHot']);
Route::get('/books/featured', [BookController::class, 'getFeatured']);
Route::get('/books/carousel', [BookController::class, 'getCarousel']);
Route::get('/books/{id}', [BookController::class, 'show']);
Route::get('/categories', [BookController::class, 'categories']);

// Ebooks (Public - metadata only)
Route::get('/ebooks', [EbookController::class, 'index']);
Route::get('/ebooks/{id}', [EbookController::class, 'show']);

// Sepay Callback (Webhook - no auth)
Route::post('/sepay-callback', [PaymentController::class, 'sepayCallback']);


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

    // Borrow Management
    Route::get('/my-borrows', [BorrowController::class, 'myBorrows']);
    Route::post('/borrow/{copyId}', [BorrowController::class, 'borrow']);
    Route::post('/return/{borrowId}', [BorrowController::class, 'returnBook']);
    Route::post('/renew/{borrowId}', [BorrowController::class, 'renew']);
    
    // Reservations
    Route::get('/my-reservations', [BorrowController::class, 'myReservations']);
    Route::post('/reserve/{bookId}', [BorrowController::class, 'reserve']);
    Route::delete('/reservation/{id}', [BorrowController::class, 'cancelReservation']);

    // Ebook User Actions
    Route::get('/my-ebooks', [EbookController::class, 'myEbooks']);
    Route::post('/ebooks/{id}/purchase', [EbookController::class, 'purchase']);
    Route::get('/ebooks/{id}/read', [EbookController::class, 'read']);

    // Reviews
    Route::post('/reviews/book/{bookId}', [BorrowController::class, 'reviewBook']);
    Route::post('/reviews/ebook/{ebookId}', [BorrowController::class, 'reviewEbook']);

    // Payment
    Route::post('/deposit', [PaymentController::class, 'deposit']);

    // Library Ticket
    Route::post('/buy-library-ticket', [BorrowController::class, 'buyLibraryTicket']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);


    // ============================================
    // AUTHOR ROUTES
    // ============================================
    Route::middleware('role:author')->prefix('author')->group(function () {
        Route::post('/ebooks', [AuthorEbookController::class, 'store']);
        Route::get('/ebooks', [AuthorEbookController::class, 'index']);
        Route::put('/ebooks/{id}', [AuthorEbookController::class, 'update']);
        Route::get('/earnings', [AuthorEbookController::class, 'earnings']);
        Route::post('/withdraw', [AuthorEbookController::class, 'withdraw']);
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

        // Offline Borrow/Return
        Route::post('/borrow/offline', [LibrarianController::class, 'borrowOffline']);
        Route::post('/return/{borrowId}', [LibrarianController::class, 'returnOffline']);

        // Reservations
        Route::get('/reservations', [LibrarianController::class, 'reservations']);
        Route::post('/reservations/{id}/confirm', [LibrarianController::class, 'confirmReservation']);

        // Lost Books
        Route::post('/books/{copyId}/mark-lost', [LibrarianController::class, 'markLost']);

        // CCCD Verification
        Route::put('/users/{id}/verify-cccd', [LibrarianController::class, 'verifyCccd']);

        // Hot Books Management
        Route::post('/settings/books/hot', [LibrarianController::class, 'setHotBooks']);
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
        Route::post('/ebooks/{id}/approve', [AdminController::class, 'approveEbook']);
        Route::post('/ebooks/{id}/reject', [AdminController::class, 'rejectEbook']);

        // Withdrawal Requests
        Route::get('/withdraw-requests', [AdminController::class, 'withdrawalRequests']);
        Route::post('/withdraw-requests/{id}/process', [AdminController::class, 'processWithdrawal']);

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
    });
});

// Broadcasting Auth (for WebSocket)
Route::post('/broadcasting/auth', function () {
    return response()->json(['channel_name' => request('channel_name')]);
})->middleware('auth:api');
