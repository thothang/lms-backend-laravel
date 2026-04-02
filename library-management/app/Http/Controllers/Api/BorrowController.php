<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookCopy;
use App\Models\BorrowRecord;
use App\Models\LibraryTicket;
use App\Models\Review;
use App\Models\Transaction;
use App\Services\BorrowService;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class BorrowController extends Controller
{
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
     * Get user's borrow history
     */
    public function myBorrows(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $borrows = BorrowRecord::with('copy.book')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($borrows);
    }

    /**
     * Borrow a book
     */
    public function borrow(Request $request, int $copyId): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $copy = BookCopy::with('book')->find($copyId);

        if (!$copy) {
            return response()->json([
                'error' => 'Bản sao sách không tồn tại',
            ], 404);
        }

        $result = $this->borrowService->borrow($user, $copy);

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message'],
            ], 422);
        }

        return response()->json([
            'message' => 'Mượn sách thành công',
            'borrow_record' => $result['borrow_record'],
        ]);
    }

    /**
     * Return a book
     */
    public function returnBook(Request $request, int $borrowId): JsonResponse
    {
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

        return response()->json($result);
    }

    /**
     * Renew a borrow
     */
    public function renew(Request $request, int $borrowId): JsonResponse
    {
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

        return response()->json([
            'message' => 'Gia hạn sách thành công',
            'borrow_record' => $result['borrow_record'],
        ]);
    }

    /**
     * Get user's reservations
     */
    public function myReservations(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $reservations = $user->reservations()
            ->with('book')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($reservations);
    }

    /**
     * Reserve a book
     */
    public function reserve(Request $request, int $bookId): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $expectedDays = $request->input('expected_borrow_days', 9);

        $result = $this->reservationService->reserve($user, $bookId, $expectedDays);

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message'],
            ], 422);
        }

        return response()->json([
            'message' => 'Đặt trước thành công, phí giữ chỗ 10% đã trừ',
            'reservation_id' => $result['reservation_id'],
            'fee_paid' => $result['fee_paid'],
            'queue_position' => $result['queue_position'],
        ]);
    }

    /**
     * Cancel a reservation
     */
    public function cancelReservation(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $result = $this->reservationService->cancel($user, $id);

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message'],
            ], 422);
        }

        return response()->json([
            'message' => 'Hủy đặt trước thành công',
        ]);
    }

    /**
     * Review a book
     */
    public function reviewBook(Request $request, int $bookId): JsonResponse
    {
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

        return response()->json([
            'message' => 'Đánh giá thành công',
            'review' => $review,
        ], 201);
    }

    /**
     * Review an ebook
     */
    public function reviewEbook(Request $request, int $ebookId): JsonResponse
    {
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

        return response()->json([
            'message' => 'Đánh giá thành công',
            'review' => $review,
        ], 201);
    }

    /**
     * Buy library ticket
     */
    public function buyLibraryTicket(Request $request): JsonResponse
    {
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

        return response()->json([
            'message' => 'Mua vé thư viện thành công',
            'ticket' => [
                'id' => $ticket->id,
                'valid_from' => $ticket->valid_from,
                'valid_to' => $ticket->valid_to,
                'amount' => $ticket->amount,
            ],
        ]);
    }
}
