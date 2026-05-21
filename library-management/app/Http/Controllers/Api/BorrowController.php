<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookCopy;
use App\Models\BorrowRecord;
use App\Models\LibraryTicket;
use App\Models\Notification;
use App\Models\Review;
use App\Models\Transaction;
use App\Services\BorrowService;
use App\Services\ReservationService;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class BorrowController extends Controller
{
    use HandlesApiExceptions;

    protected $borrowService;
    protected $reservationService;

    public function __construct(
        BorrowService $borrowService,
        ReservationService $reservationService
    ) {
        $this->borrowService = $borrowService;
        $this->reservationService = $reservationService;
    }

    /**
     * Get user's borrow records
     */
    public function myBorrows(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $user = JWTAuth::parseToken()->authenticate();

            // Don't cache pagination as it changes with page/limit parameters
            $borrows = BorrowRecord::with('copy.book')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json($borrows);
        }, 'Không thể lấy danh sách mượn sách');
    }

    /**
     * Borrow a book
     */
    public function borrow(Request $request, int $bookId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $bookId) {
            $user = JWTAuth::parseToken()->authenticate();

            // Find the first available copy of the book
            $copy = BookCopy::where('book_id', $bookId)
                ->where('status', 'available')
                ->first();

            if (!$copy) {
                return response()->json([
                    'error' => 'Sách không còn bản sao khả dụng',
                ], 422);
            }

            $days = $request->input('days', 9);
            $result = $this->borrowService->borrow($user, $copy, $days);

            if (!$result['success']) {
                return response()->json([
                    'error' => $result['message'],
                ], 422);
            }

            // Notify user about successful borrow
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Mượn sách thành công',
                'content' => "Bạn đã mượn thành công sách '{$copy->book->title}'. Hạn trả: {$result['borrow_record']['due_date']}.",
                'type' => Notification::TYPE_WEB,
            ]);

            // Clear report overview cache
            Cache::forget('reports.overview');
            Cache::forget('admin.borrow_stats');
            Cache::forget('admin.deposit_summary');
            // Clear home page cache (contains carousel, hot, featured books)
            Cache::forget('home.carousel.books');
            Cache::forget('home.hot.books');
            Cache::forget('home.featured.books');
            // Clear book list cache
            Cache::forget('books.carousel');
            Cache::forget('books.hot');
            Cache::forget('books.featured');
            // Clear admin transactions cache
            Cache::forget('admin.transactions');

            return response()->json([
                'message' => 'Mượn sách thành công',
                'borrow_record' => $result['borrow_record'],
            ]);
        }, 'Không thể mượn sách');
    }

    /**
     * Return a book
     */
    public function returnBook(Request $request, int $borrowId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($borrowId) {
            $user = JWTAuth::parseToken()->authenticate();
            $borrowRecord = BorrowRecord::with('copy.book')->find($borrowId);

            if (!$borrowRecord) {
                return response()->json([
                    'error' => 'Phiếu mượn không tồn tại',
                ], 404);
            }

            if ($borrowRecord->user_id !== $user->id) {
                return response()->json([
                    'error' => 'Bạn không có quyền trả sách này',
                ], 403);
            }

            $result = $this->borrowService->returnBook($borrowRecord);

            // Notify user about successful return
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Trả sách thành công',
                'content' => "Bạn đã trả thành công sách '{$borrowRecord->copy->book->title}'. Cảm ơn bạn đã trả sách đúng hạn.",
                'type' => Notification::TYPE_WEB,
            ]);

            // Clear report overview cache
            Cache::forget('reports.overview');
            Cache::forget('admin.borrow_stats');
            Cache::forget('admin.deposit_summary');
            // Clear home page cache (contains carousel, hot, featured books)
            Cache::forget('home.carousel.books');
            Cache::forget('home.hot.books');
            Cache::forget('home.featured.books');
            // Clear book list cache
            Cache::forget('books.carousel');
            Cache::forget('books.hot');
            Cache::forget('books.featured');
            // Clear admin transactions cache
            Cache::forget('admin.transactions');

            return response()->json($result);
        }, 'Không thể trả sách');
    }

    /**
     * Renew a borrow
     */
    public function renew(Request $request, int $borrowId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $borrowId) {
            $user = JWTAuth::parseToken()->authenticate();
            $borrowRecord = BorrowRecord::with('copy.book')->find($borrowId);

            if (!$borrowRecord) {
                return response()->json([
                    'error' => 'Phiếu mượn không tồn tại',
                ], 404);
            }

            if ($borrowRecord->user_id !== $user->id) {
                return response()->json([
                    'error' => 'Bạn không có quyền gia hạn sách này',
                ], 403);
            }

            $days = $request->input('days', 9);
            $result = $this->borrowService->renew($borrowRecord, $days);

            if (!$result['success']) {
                return response()->json([
                    'error' => $result['message'],
                ], 422);
            }

            // Notify user about successful renew
            $newDueDate = Carbon::parse($result['borrow_record']['due_date']);
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Gia hạn sách thành công',
                'content' => "Bạn đã gia hạn thành công sách '{$borrowRecord->copy->book->title}'. Hạn trả mới: {$newDueDate->format('d/m/Y')}.",
                'type' => Notification::TYPE_WEB,
            ]);

            return response()->json([
                'message' => 'Gia hạn sách thành công',
                'borrow_record' => $result['borrow_record'],
            ]);
        }, 'Không thể gia hạn sách');
    }

    /**
     * Get user's reservations
     */
    public function myReservations(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $user = JWTAuth::parseToken()->authenticate();

            $reservations = $user->reservations()
                ->with('book')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json($reservations);
        }, 'Không thể lấy danh sách đặt trước');
    }

    /**
     * Reserve a book
     */
    public function reserve(Request $request, int $bookId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $bookId) {
            $user = JWTAuth::parseToken()->authenticate();
            $expectedDays = $request->input('expected_borrow_days', 9);

            $result = $this->reservationService->reserve($user, $bookId, $expectedDays);

            if (!$result['success']) {
                return response()->json([
                    'error' => $result['message'],
                ], 422);
            }

            // Notify user about successful reservation
            $book = \App\Models\Book::find($bookId);
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Đặt trước sách thành công',
                'content' => "Bạn đã đặt trước thành công sách '{$book->title}'. Vị trí trong hàng đợi: {$result['queue_position']}.",
                'type' => Notification::TYPE_WEB,
            ]);

            // Clear home page cache (contains carousel, hot, featured books)
            Cache::forget('home.carousel.books');
            Cache::forget('home.hot.books');
            Cache::forget('home.featured.books');
            // Clear book list cache
            Cache::forget('books.carousel');
            Cache::forget('books.hot');
            Cache::forget('books.featured');
            // Clear admin transactions cache
            Cache::forget('admin.transactions');

            return response()->json([
                'message' => 'Đặt trước thành công, phí giữ chỗ 10% đã trừ',
                'reservation_id' => $result['reservation_id'],
                'fee_paid' => $result['fee_paid'],
                'queue_position' => $result['queue_position'],
            ]);
        }, 'Không thể đặt trước sách');
    }

    /**
     * Cancel a reservation
     */
    public function cancelReservation(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $user = JWTAuth::parseToken()->authenticate();

            $result = $this->reservationService->cancel($user, $id);

            if (!$result['success']) {
                return response()->json([
                    'error' => $result['message'],
                ], 422);
            }

            // Notify user about successful cancellation
            $reservation = \App\Models\Reservation::find($id);
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Hủy đặt trước thành công',
                'content' => "Bạn đã hủy đặt trước thành công. Phí giữ chỗ đã được hoàn lại.",
                'type' => Notification::TYPE_WEB,
            ]);

            // Clear admin transactions cache
            Cache::forget('admin.transactions');

            return response()->json([
                'message' => 'Hủy đặt trước thành công',
            ]);
        }, 'Không thể hủy đặt trước');
    }

    /**
     * Review a book
     */
    public function reviewBook(Request $request, int $bookId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $bookId) {
            $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $user = JWTAuth::parseToken()->authenticate();

            // Check if user has borrowed this book
            $hasBorrowed = BorrowRecord::where('user_id', $user->id)
                ->whereHas('copy', function ($q) use ($bookId) {
                    $q->where('book_id', $bookId);
                })
                ->exists();

            if (!$hasBorrowed) {
                return response()->json([
                    'error' => 'Bạn chưa mượn sách này',
                ], 422);
            }

            // Check if already reviewed
            $existingReview = Review::where('user_id', $user->id)
                ->where('book_id', $bookId)
                ->first();

            if ($existingReview) {
                return response()->json([
                    'error' => 'Bạn đã đánh giá sách này rồi',
                ], 422);
            }

            $review = Review::create([
                'user_id' => $user->id,
                'book_id' => $bookId,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            // Clear book cache to reflect new review immediately
            Cache::forget("books.show.{$bookId}");

            // Get book info for notification
            $book = \App\Models\Book::find($bookId);

            // Notify author/librarian about new review
            if ($book) {
                Notification::create([
                    'user_id' => $book->author_id,
                    'title' => 'Có đánh giá mới cho sách',
                    'content' => "Sách '{$book->title}' đã nhận được đánh giá {$request->rating} sao từ {$user->name}.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            return response()->json([
                'message' => 'Đánh giá thành công',
                'review' => $review,
            ], 201);
        }, 'Không thể đánh giá sách');
    }

    /**
     * Review an ebook
     */
    public function reviewEbook(Request $request, int $ebookId): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $ebookId) {
            $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $user = JWTAuth::parseToken()->authenticate();

            // Check if user has purchased this ebook
            $hasPurchased = \App\Models\EbookPurchase::where('user_id', $user->id)
                ->where('ebook_id', $ebookId)
                ->exists();

            if (!$hasPurchased) {
                return response()->json([
                    'error' => 'Bạn chưa mua ebook này',
                ], 422);
            }

            // Check if already reviewed
            $existingReview = Review::where('user_id', $user->id)
                ->where('ebook_id', $ebookId)
                ->first();

            if ($existingReview) {
                return response()->json([
                    'error' => 'Bạn đã đánh giá ebook này rồi',
                ], 422);
            }

            $review = Review::create([
                'user_id' => $user->id,
                'ebook_id' => $ebookId,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            // Clear ebook cache to reflect new review immediately
            Cache::forget("ebooks.show.{$ebookId}");

            // Get ebook info for notification
            $ebook = \App\Models\Ebook::find($ebookId);

            // Notify author about new review
            if ($ebook) {
                Notification::create([
                    'user_id' => $ebook->author_id,
                    'title' => 'Có đánh giá mới cho ebook',
                    'content' => "Ebook '{$ebook->title}' đã nhận được đánh giá {$request->rating} sao từ {$user->name}.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            return response()->json([
                'message' => 'Đánh giá thành công',
                'review' => $review,
            ], 201);
        }, 'Không thể đánh giá ebook');
    }

    /**
     * Buy library ticket
     */
    public function buyLibraryTicket(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'days' => 'required|integer|min:1|max:365',
            ]);

            $user = JWTAuth::parseToken()->authenticate();
            $days = $request->days;

            // Calculate price (e.g., 10,000 VND per day)
            $pricePerDay = 10000;
            $amount = $days * $pricePerDay;

            // Check balance
            if ($user->balance < $amount) {
                return response()->json([
                    'error' => 'Số dư không đủ',
                ], 422);
            }

            // Deduct balance
            $user->subtractBalance($amount);

            // Create ticket
            $validFrom = Carbon::now();
            $validTo = Carbon::now()->addDays($days);

            $ticket = LibraryTicket::create([
                'user_id' => $user->id,
                'purchase_date' => Carbon::now(),
                'valid_from' => $validFrom,
                'valid_to' => $validTo,
                'amount' => $amount,
            ]);

            // Create transaction
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'type' => 'library_ticket',
                'status' => 'success',
                'metadata' => [
                    'ticket_id' => $ticket->id,
                    'days' => $days,
                ],
            ]);

            // Notify admin about library ticket purchase
            $admin = \App\Models\User::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Vé thư viện được mua',
                    'content' => "Người dùng {$user->name} đã mua vé thư viện {$days} ngày với số tiền " . number_format($amount) . " VNĐ.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            return response()->json([
                'message' => 'Mua vé thư viện thành công',
                'ticket' => [
                    'id' => $ticket->id,
                    'valid_from' => $ticket->valid_from,
                    'valid_to' => $ticket->valid_to,
                    'amount' => $ticket->amount,
                ],
            ]);
        }, 'Không thể mua vé thư viện');
    }
}
