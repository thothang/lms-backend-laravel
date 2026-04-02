<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookCategory;
use App\Models\BorrowRecord;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Transaction;
use App\Models\AuditLog;
use App\Services\BorrowService;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;
use Illuminate\Support\Str;

class LibrarianController extends Controller
{
    protected $borrowService;
    protected $reservationService;

    public function __construct(BorrowService $borrowService, ReservationService $reservationService)
    {
        $this->borrowService = $borrowService;
        $this->reservationService = $reservationService;
    }

    /**
     * Create a new book
     */
    public function createBook(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'author_name' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'category_id' => 'required|exists:book_categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'daily_fee' => 'nullable|numeric|min:0',
            'copies' => 'required|integer|min:1',
        ]);

        $librarian = JWTAuth::parseToken()->authenticate();

        $book = Book::create([
            'title' => $request->title,
            'author_name' => $request->author_name,
            'publisher' => $request->publisher,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'price' => $request->price,
            'daily_fee' => $request->daily_fee,
            'total_copies' => 0,
            'available_copies' => 0,
        ]);

        // Create copies with barcodes
        $copies = [];
        for ($i = 1; $i <= $request->copies; $i++) {
            $copies[] = BookCopy::create([
                'book_id' => $book->id,
                'barcode' => 'BK' . $book->id . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'status' => 'available',
            ]);
        }

        $book->update([
            'total_copies' => count($copies),
            'available_copies' => count($copies),
        ]);

        // Log action
        AuditLog::log(
            $librarian->id,
            'CREATE_BOOK',
            'books',
            $book->id,
            null,
            ['title' => $book->title, 'copies' => count($copies)]
        );

        return response()->json([
            'message' => 'Tạo sách thành công',
            'book' => $book->load('copies'),
        ], 201);
    }

    /**
     * Update a book
     */
    public function updateBook(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'author_name' => 'sometimes|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'category_id' => 'sometimes|exists:book_categories,id',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'daily_fee' => 'nullable|numeric|min:0',
        ]);

        $book = Book::find($id);

        if (!$book) {
            return response()->json(['error' => 'Sách không tồn tại'], 404);
        }

        $oldValues = $book->only(['title', 'author_name', 'publisher', 'price', 'daily_fee']);

        $book->update($request->only([
            'title', 'author_name', 'publisher', 'category_id', 'description', 'price', 'daily_fee'
        ]));

        // Log action
        AuditLog::log(
            JWTAuth::parseToken()->id(),
            'UPDATE_BOOK',
            'books',
            $book->id,
            $oldValues,
            $book->only(['title', 'author_name', 'publisher', 'price', 'daily_fee'])
        );

        return response()->json([
            'message' => 'Cập nhật sách thành công',
            'book' => $book,
        ]);
    }

    /**
     * Delete a book (soft delete)
     */
    public function deleteBook(int $id): JsonResponse
    {
        $book = Book::find($id);

        if (!$book) {
            return response()->json(['error' => 'Sách không tồn tại'], 404);
        }

        // Check if any copies are borrowed
        $hasActiveBorrows = $book->copies()
            ->whereHas('borrowRecord', function ($q) {
                $q->whereIn('status', ['active', 'overdue']);
            })
            ->exists();

        if ($hasActiveBorrows) {
            return response()->json([
                'error' => 'Không thể xóa sách đang được mượn',
            ], 422);
        }

        $book->delete();

        // Log action
        AuditLog::log(
            JWTAuth::parseToken()->id(),
            'DELETE_BOOK',
            'books',
            $book->id,
            ['title' => $book->title],
            null
        );

        return response()->json([
            'message' => 'Xóa sách thành công',
        ]);
    }

    /**
     * Add copies to a book
     */
    public function addCopy(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
        ]);

        $book = Book::find($id);

        if (!$book) {
            return response()->json(['error' => 'Sách không tồn tại'], 404);
        }

        $existingCopiesCount = $book->copies()->count();
        $newCopies = [];

        for ($i = 1; $i <= $request->quantity; $i++) {
            $newCopies[] = BookCopy::create([
                'book_id' => $book->id,
                'barcode' => 'BK' . $book->id . '-' . str_pad($existingCopiesCount + $i, 4, '0', STR_PAD_LEFT),
                'status' => 'available',
            ]);
        }

        $book->updateAvailableCopies();

        return response()->json([
            'message' => 'Thêm bản sao thành công',
            'added_copies' => count($newCopies),
            'book' => $book->load('copies'),
        ]);
    }

    /**
     * Delete a copy
     */
    public function deleteCopy(int $id): JsonResponse
    {
        $copy = BookCopy::find($id);

        if (!$copy) {
            return response()->json(['error' => 'Bản sao không tồn tại'], 404);
        }

        // Check if borrowed
        if ($copy->status !== 'available') {
            return response()->json([
                'error' => 'Không thể xóa bản sao đang được mượn',
            ], 422);
        }

        $book = $copy->book;
        $copy->delete();
        $book->updateAvailableCopies();

        return response()->json([
            'message' => 'Xóa bản sao thành công',
        ]);
    }

    /**
     * Borrow offline for walk-in guest
     */
    public function borrowOffline(Request $request): JsonResponse
    {
        $request->validate([
            'copy_id' => 'required|exists:book_copies,id',
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'required|string|max:20',
            'guest_cccd' => 'nullable|string|max:20',
        ]);

        $librarian = JWTAuth::parseToken()->authenticate();
        $copy = BookCopy::with('book')->find($request->copy_id);

        if (!$copy->isAvailable()) {
            return response()->json(['error' => 'Bản sao không khả dụng'], 422);
        }

        $book = $copy->book;
        $dailyFee = $book->getEffectiveDailyFee();
        $depositAmount = $book->getDepositAmount();
        $borrowDays = config('library.default_borrow_days', 9);

        // Create borrow record for guest
        $borrowRecord = BorrowRecord::create([
            'copy_id' => $copy->id,
            'guest_name' => $request->guest_name,
            'guest_phone' => $request->guest_phone,
            'guest_cccd' => $request->guest_cccd,
            'borrow_date' => Carbon::now(),
            'due_date' => Carbon::now()->addDays($borrowDays),
            'daily_fee_applied' => $dailyFee,
            'deposit_amount' => $depositAmount,
            'status' => 'active',
        ]);

        $copy->update(['status' => 'borrowed']);
        $book->updateAvailableCopies();

        // Log action
        AuditLog::log(
            $librarian->id,
            'OFFLINE_BORROW',
            'borrow_records',
            $borrowRecord->id,
            null,
            ['copy_id' => $copy->id, 'guest_name' => $request->guest_name]
        );

        return response()->json([
            'message' => 'Mượn sách thành công',
            'borrow_record' => [
                'id' => $borrowRecord->id,
                'guest_name' => $borrowRecord->guest_name,
                'due_date' => $borrowRecord->due_date->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Return book offline
     */
    public function returnOffline(int $borrowId): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();
        $borrowRecord = BorrowRecord::with('copy.book')->find($borrowId);

        if (!$borrowRecord) {
            return response()->json(['error' => 'Phiếu mượn không tồn tại'], 404);
        }

        if ($borrowRecord->status === 'returned') {
            return response()->json(['error' => 'Sách đã được trả'], 422);
        }

        $result = $this->borrowService->returnBook($borrowRecord);

        // Log action
        AuditLog::log(
            $librarian->id,
            'OFFLINE_RETURN',
            'borrow_records',
            $borrowRecord->id,
            ['status' => $borrowRecord->status],
            ['status' => 'returned']
        );

        return response()->json($result);
    }

    /**
     * Get all reservations
     */
    public function reservations(Request $request): JsonResponse
    {
        $query = Reservation::with('user:id,name,email', 'book:id,title');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($reservations);
    }

    /**
     * Confirm a reservation
     */
    public function confirmReservation(int $id): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();
        $reservation = Reservation::with('book')->find($id);

        if (!$reservation) {
            return response()->json(['error' => 'Reservation không tồn tại'], 404);
        }

        if ($reservation->status !== 'pending') {
            return response()->json(['error' => 'Reservation không ở trạng thái chờ'], 422);
        }

        // Find an available copy
        $copy = $reservation->book->copies()->where('status', 'available')->first();

        if (!$copy) {
            return response()->json(['error' => 'Không có bản sao khả dụng'], 422);
        }

        $reservation->update([
            'status' => 'fulfilled',
            'copy_id' => $copy->id,
        ]);

        // Log action
        AuditLog::log(
            $librarian->id,
            'CONFIRM_RESERVATION',
            'reservations',
            $reservation->id
        );

        return response()->json([
            'message' => 'Xác nhận reservation thành công',
            'reservation' => $reservation,
        ]);
    }

    /**
     * Mark book as lost/damaged
     */
    public function markLost(Request $request, int $copyId): JsonResponse
    {
        $request->validate([
            'borrow_id' => 'required|exists:borrow_records,id',
            'damage_type' => 'required|in:lost,damaged',
        ]);

        $librarian = JWTAuth::parseToken()->authenticate();
        $copy = BookCopy::with('book')->find($copyId);
        $borrowRecord = BorrowRecord::find($request->borrow_id);

        if (!$copy || !$borrowRecord) {
            return response()->json(['error' => 'Không tìm thấy'], 404);
        }

        $book = $copy->book;
        $compensationAmount = $book->price; // 100% of book price

        // Update copy status
        $copy->update(['status' => $request->damage_type === 'lost' ? 'lost' : 'damaged']);

        // Update borrow record
        $borrowRecord->update(['status' => 'lost']);

        // Create debt if user doesn't have enough balance
        if ($borrowRecord->user_id) {
            $user = $borrowRecord->user;
            
            if ($user->balance >= $compensationAmount) {
                $user->subtractBalance($compensationAmount);
            } else {
                $remaining = $compensationAmount - $user->balance;
                if ($remaining > 0) {
                    $user->subtractBalance($user->balance);
                    $user->addDebt($remaining);

                    \App\Models\UserDebt::create([
                        'user_id' => $user->id,
                        'amount' => $compensationAmount,
                        'paid_amount' => $compensationAmount - $remaining,
                        'reason' => 'lost_book_damage',
                        'borrow_record_id' => $borrowRecord->id,
                        'due_date' => Carbon::now()->addDays(7),
                    ]);
                }
            }
        }

        $book->updateAvailableCopies();

        // Log action
        AuditLog::log(
            $librarian->id,
            'MARK_LOST',
            'book_copies',
            $copy->id,
            null,
            ['damage_type' => $request->damage_type, 'amount' => $compensationAmount]
        );

        return response()->json([
            'message' => 'Đã ghi nhận mất/hư sách',
            'compensation_amount' => $compensationAmount,
        ]);
    }

    /**
     * Verify user CCCD
     */
    public function verifyCccd(int $id): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Người dùng không tồn tại'], 404);
        }

        if ($user->status !== 'unverified') {
            return response()->json(['error' => 'Người dùng đã được xác minh'], 422);
        }

        $user->update(['status' => 'active']);

        // Create notification
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Tài khoản đã được kích hoạt',
            'content' => 'Tài khoản của bạn đã được xác minh CCCD và kích hoạt. Bạn có thể bắt đầu sử dụng dịch vụ thư viện.',
            'type' => 'web',
        ]);

        // Log action
        AuditLog::log(
            $librarian->id,
            'VERIFY_CCCD',
            'users',
            $user->id,
            ['status' => 'unverified'],
            ['status' => 'active']
        );

        return response()->json([
            'message' => 'Xác minh CCCD thành công',
            'user_status' => 'active',
        ]);
    }

    /**
     * Set hot/featured/carousel books
     */
    public function setHotBooks(Request $request): JsonResponse
    {
        $request->validate([
            'book_id' => 'required|exists:books,id',
            'is_hot' => 'boolean',
            'is_featured' => 'boolean',
            'in_carousel' => 'boolean',
            'carousel_order' => 'nullable|integer|min:0',
        ]);

        $book = Book::find($request->book_id);

        $book->update([
            'is_hot' => $request->input('is_hot', false),
            'is_featured' => $request->input('is_featured', false),
            'in_carousel' => $request->input('in_carousel', false),
            'carousel_order' => $request->input('carousel_order', 0),
        ]);

        return response()->json([
            'message' => 'Cập nhật thành công',
            'book' => $book,
        ]);
    }
}
