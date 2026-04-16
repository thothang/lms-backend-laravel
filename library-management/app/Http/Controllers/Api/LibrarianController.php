<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookCategory;
use App\Models\BorrowRecord;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Ebook;
use App\Models\Transaction;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Services\BorrowService;
use App\Services\ReservationService;
use Illuminate\Support\Facades\DB;
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
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
        ]);

        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = $request->file('cover_image')->store('covers/books', 'public');
        } elseif ($request->filled('cover_image')) {
            $coverImagePath = $request->cover_image;
        }

        $librarian = JWTAuth::parseToken()->authenticate();

        $book = Book::create([
            'title' => $request->title,
            'author_name' => $request->author_name,
            'publisher' => $request->publisher,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'cover_image' => $coverImagePath,
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

        // Notify admin about new book
        $admin = \App\Models\User::where('role', 'admin')->first();
        if ($admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'Sách mới được tạo',
                'content' => "Thủ thư {$librarian->name} đã tạo sách mới: '{$book->title}' với {$request->copies} bản sao.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

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
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
            'price' => 'sometimes|numeric|min:0',
            'daily_fee' => 'nullable|numeric|min:0',
        ]);

        $book = Book::find($id);

        if (!$book) {
            return response()->json(['error' => 'Sách không tồn tại'], 404);
        }

        $oldValues = $book->only(['title', 'author_name', 'publisher', 'price', 'daily_fee']);

        $updateData = $request->only([
            'title', 'author_name', 'publisher', 'category_id', 'description', 'price', 'daily_fee'
        ]);

        if ($request->hasFile('cover_image')) {
            $updateData['cover_image'] = $request->file('cover_image')->store('covers/books', 'public');
        } elseif ($request->filled('cover_image')) {
            $updateData['cover_image'] = $request->cover_image;
        }

        $book->update($updateData);

        // Log action
        AuditLog::log(
            auth()->id(),
            'UPDATE_BOOK',
            'books',
            $book->id,
            $oldValues,
            $book->only(['title', 'author_name', 'publisher', 'price', 'daily_fee'])
        );

        // Notify admin about book update
        $admin = \App\Models\User::where('role', 'admin')->first();
        if ($admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'Sách được cập nhật',
                'content' => "Sách '{$book->title}' đã được cập nhật bởi thủ thư.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

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
            auth()->id(),
            'DELETE_BOOK',
            'books',
            $book->id,
            ['title' => $book->title],
            null
        );

        // Notify admin about book deletion
        $admin = \App\Models\User::where('role', 'admin')->first();
        if ($admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'Sách được xóa tạm thời',
                'content' => "Sách '{$book->title}' đã được thủ thư xóa tạm thời (di chuyển vào thùng rác).",
                'type' => Notification::TYPE_WEB,
            ]);
        }

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
        $reservation = Reservation::with(['book', 'user'])->find($id);

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

        // Notify user
        \App\Models\Notification::create([
            'user_id' => $reservation->user_id,
            'title' => 'Đặt trước đã được xác nhận',
            'content' => "Sách '{$reservation->book->title}' đã sẵn sàng để bạn mượn tại thư viện.",
            'type' => \App\Models\Notification::TYPE_WEB,
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
                $balanceDeducted = $compensationAmount;
            } else {
                $remaining = $compensationAmount - $user->balance;
                if ($remaining > 0) {
                    $balanceDeducted = $user->balance;
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
                } else {
                    $balanceDeducted = 0;
                }
            }

            // Cộng tiền bồi thường vào tài khoản thư viện (admin earnings)
            if (isset($balanceDeducted) && $balanceDeducted > 0) {
                $admin = User::where('role', 'admin')->first();
                if ($admin) {
                    $admin->addEarnings($balanceDeducted);

                    Transaction::create([
                        'user_id' => $admin->id,
                        'amount' => $balanceDeducted,
                        'type' => 'library_fee_income',
                        'status' => 'success',
                        'metadata' => [
                            'borrow_id' => $borrowRecord->id,
                            'book_id' => $book->id,
                            'description' => 'Tiền bồi thường sách mất/hỏng',
                        ],
                    ]);

                    Notification::create([
                        'user_id' => $admin->id,
                        'title' => 'Tiền bồi thường sách mất',
                        'content' => "Sách '{$book->title}' đã được báo mất/hỏng. Tiền bồi thường " . number_format($balanceDeducted) . " VNĐ đã được cộng vào tài khoản thư viện.",
                        'type' => Notification::TYPE_WEB,
                    ]);
                }
            }

            // Notify user about lost/damaged book
            Notification::create([
                'user_id' => $user->id,
                'title' => $request->damage_type === 'lost' ? 'Sách bị mất' : 'Sách bị hỏng',
                'content' => "Sách '{$book->title}' đã được ghi nhận là " . ($request->damage_type === 'lost' ? 'mất' : 'hỏng') . ". Số tiền bồi thường: " . number_format($compensationAmount) . " VNĐ.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        $book->updateAvailableCopies();

        // Rule: If total_copies decreases and we have a full queue, cancel the last reservation
        $pendingReservations = $book->reservations()
            ->where('status', 'pending')
            ->orderBy('queue_order', 'desc')
            ->get();
            
        if ($pendingReservations->count() > $book->total_copies && $book->total_copies > 0) {
            $lastReservation = $pendingReservations->first();
            
            // Refund the user
            $userToRefund = $lastReservation->user;
            if ($userToRefund) {
                $userToRefund->addBalance($lastReservation->fee_paid);
                
                Transaction::create([
                    'user_id' => $userToRefund->id,
                    'amount' => $lastReservation->fee_paid,
                    'type' => 'deposit',
                    'status' => 'success',
                    'metadata' => [
                        'reservation_id' => $lastReservation->id,
                        'reason' => 'book_lost_queue_cancelled',
                    ],
                ]);

                Notification::create([
                    'user_id' => $userToRefund->id,
                    'title' => 'Thông báo hủy đặt trước',
                    'content' => "Sách '{$book->title}' bạn đang chờ đã bị báo mất/hỏng. Chúng tôi rất tiếc phải hủy yêu cầu của bạn và hoàn lại phí đặt trước.",
                    'type' => 'web',
                ]);
            }

            $lastReservation->update(['status' => 'cancelled']);
        }

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
     * Set hot/featured/carousel books
     */
    public function setHotBooks(Request $request): JsonResponse
    {
        $request->validate([
            'book_id' => 'required|exists:books,id',
            'is_hot' => 'boolean',
            'is_featured' => 'boolean',
            'in_carousel' => 'boolean',
        ]);

        $book = Book::find($request->book_id);
        $wasInCarousel = $book->in_carousel;
        $nowInCarousel = $request->input('in_carousel', false);
        
        // Auto-calculate carousel_order
        if ($nowInCarousel && !$wasInCarousel) {
            // Thêm mới vào carousel: lấy max + 1
            $maxOrder = Book::where('in_carousel', true)->max('carousel_order') ?? 0;
            $carouselOrder = $maxOrder + 1;
        } elseif (!$nowInCarousel && $wasInCarousel) {
            // Bỏ khỏi carousel: reorder lại các item còn lại
            $book->update(['carousel_order' => 0]);
            $this->reorderBookCarousel();
            $book->refresh();
            
            // Notify admin
            $admin = \App\Models\User::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Sách được gỡ khỏi carousel',
                    'content' => "Sách '{$book->title}' đã được gỡ khỏi danh sách carousel.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }
            
            $book->update([
                'is_hot' => $request->input('is_hot', false),
                'is_featured' => $request->input('is_featured', false),
                'in_carousel' => false,
            ]);

            return response()->json([
                'message' => 'Đã gỡ sách khỏi carousel',
                'book' => $book,
            ]);
        } elseif ($nowInCarousel) {
            // Đã có trong carousel, giữ nguyên order
            $carouselOrder = $book->carousel_order ?: 1;
        } else {
            $carouselOrder = 0;
        }

        $book->update([
            'is_hot' => $request->input('is_hot', false),
            'is_featured' => $request->input('is_featured', false),
            'in_carousel' => $nowInCarousel,
            'carousel_order' => $carouselOrder,
        ]);

        // Notify admin about book status change
        $admin = \App\Models\User::where('role', 'admin')->first();
        if ($admin) {
            $changes = [];
            if ($book->is_hot) $changes[] = 'nổi bật (hot)';
            if ($book->is_featured) $changes[] = 'đề xuất (featured)';
            if ($book->in_carousel) $changes[] = 'carousel';

            if (!empty($changes)) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Sách được đánh dấu đặc biệt',
                    'content' => "Sách '{$book->title}' đã được thủ thư thêm vào danh sách: " . implode(', ', $changes) . ".",
                    'type' => Notification::TYPE_WEB,
                ]);
            }
        }

        return response()->json([
            'message' => 'Cập nhật thành công',
            'book' => $book,
        ]);
    }

    /**
     * Upload ebook by librarian (revenue goes to admin 100%)
     * Author info is stored as name, not as user account
     */
    public function uploadEbook(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:book_categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_free' => 'required|in:0,1',
            'file' => 'required|file|mimes:pdf|max:51200', // 50MB
            'cover_image' => 'nullable|image|max:5120', // 5MB
            'free_preview_pages' => 'nullable|integer|min:0',
            'author_name' => 'required|string|max:255', // Required for librarian uploads
        ]);

        $librarian = JWTAuth::parseToken()->authenticate();
        $data = $request->except(['file', 'cover_image']);
        $data['is_free'] = $request->is_free == '1';
        
        // Handle file upload
        $file = $request->file('file');
        $path = $file->store('ebooks/librarian_' . $librarian->id, 'local');

        // Handle cover image
        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = $request->file('cover_image')->store('covers/ebooks', 'public');
        }

        // Create ebook with approved status
        // author_id = librarian's id (to check uploader role in purchase logic)
        // author_name = the actual author name (display only, not a user account)
        // uploaded_by_admin = true (indicates this is a library ebook, 100% revenue to admin)
        $ebook = Ebook::create([
            'title' => $data['title'],
            'author_id' => $librarian->id, // Librarian's ID for role checking
            'author_name' => $request->author_name, // Actual author name to display
            'category_id' => $data['category_id'],
            'description' => $data['description'] ?? null,
            'cover_image' => $coverImagePath,
            'price' => $data['price'],
            'file_path' => $path,
            'free_preview_pages' => $data['free_preview_pages'] ?? 0,
            'is_free' => $data['is_free'],
            'status' => 'approved',
            'uploaded_by_admin' => true, // Mark as library-uploaded ebook
        ]);

        // Log action
        AuditLog::log(
            $librarian->id,
            'LIBRARIAN_UPLOAD_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['title' => $ebook->title, 'author_name' => $request->author_name]
        );

        // Notify admin about new ebook upload
        $admin = \App\Models\User::where('role', 'admin')->first();
        if ($admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'Ebook mới được tải lên bởi thủ thư',
                'content' => "Thủ thư {$librarian->name} đã tải lên ebook mới: '{$ebook->title}' (Tác giả: {$request->author_name}). Giá: " . number_format($ebook->price) . " VNĐ.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Ebook đã được tải lên và xuất bản thành công',
            'ebook_id' => $ebook->id,
        ], 201);
    }

    /**
     * Get all borrow records (for managing lost books)
     */
    public function getBorrows(Request $request): JsonResponse
    {
        $query = BorrowRecord::with(['user:id,name,email', 'copy.book', 'copy.book.category']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by keyword (user name or book title)
        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->whereHas('user', function ($uq) use ($keyword) {
                    $uq->where('name', 'like', "%{$keyword}%");
                })
                ->orWhereHas('copy.book', function ($bq) use ($keyword) {
                    $bq->where('title', 'like', "%{$keyword}%");
                })
                ->orWhere('guest_name', 'like', "%{$keyword}%");
            });
        }

        // Sort
        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        $query->orderBy($sort, $order);

        // Pagination
        $perPage = $request->limit ?? 20;
        $borrows = $query->paginate($perPage);

        return response()->json($borrows);
    }

    /**
     * Confirm user has picked up the book
     */
    public function confirmPickup(int $borrowId): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();

        $borrowRecord = BorrowRecord::with(['user:id,name', 'copy.book'])->find($borrowId);

        if (!$borrowRecord) {
            return response()->json(['error' => 'Phiếu mượn không tồn tại'], 404);
        }

        $result = $this->borrowService->confirmPickup($borrowRecord, $librarian->id);

        if (!$result['success']) {
            return response()->json(['error' => $result['message']], 400);
        }

        return response()->json([
            'message' => $result['message'],
            'borrow_record' => $result['borrow_record'],
        ]);
    }

    /**
     * Confirm user has returned the book
     */
    public function confirmReturn(int $borrowId): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();

        $borrowRecord = BorrowRecord::with(['user:id,name', 'copy.book'])->find($borrowId);

        if (!$borrowRecord) {
            return response()->json(['error' => 'Phiếu mượn không tồn tại'], 404);
        }

        $result = $this->borrowService->confirmReturn($borrowRecord, $librarian->id);

        return response()->json([
            'message' => $result['message'],
            'borrow_record' => $result['borrow_record'],
            'fee_details' => $result['fee_details'] ?? null,
        ]);
    }

    /**
     * Cancel a pending pickup request
     */
    public function cancelPickup(int $borrowId): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();

        $borrowRecord = BorrowRecord::with(['user:id,name', 'copy.book'])->find($borrowId);

        if (!$borrowRecord) {
            return response()->json(['error' => 'Phiếu mượn không tồn tại'], 404);
        }

        $result = $this->borrowService->cancelPickup($borrowRecord, $librarian->id);

        if (!$result['success']) {
            return response()->json(['error' => $result['message']], 400);
        }

        return response()->json([
            'message' => $result['message'],
            'refunded_amount' => $result['refunded_amount'],
        ]);
    }

    /**
     * Get pending pickup requests
     */
    public function pendingPickups(): JsonResponse
    {
        $borrows = BorrowRecord::with(['user:id,name,email', 'copy.book'])
            ->where('status', 'pending_pickup')
            ->orderBy('created_at', 'asc')
            ->paginate(20);

        return response()->json($borrows);
    }

    /**
     * Reorder carousel after removing an item
     */
    private function reorderBookCarousel(): void
    {
        $carouselBooks = Book::where('in_carousel', true)
            ->orderBy('carousel_order')
            ->get();

        $order = 1;
        foreach ($carouselBooks as $book) {
            $book->update(['carousel_order' => $order]);
            $order++;
        }
    }

    /**
     * Finance summary for librarian
     */
    public function financeSummary(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth();
        $endDate = $request->end_date ?? Carbon::now()->endOfMonth();

        // Get transaction stats
        $topups = Transaction::where('type', 'topup')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'success')
            ->sum('amount');

        $deposits = Transaction::where('type', 'deposit')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'success')
            ->sum('amount');

        $libraryFees = Transaction::where('type', 'library_fee_income')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'success')
            ->sum('amount');

        return response()->json([
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'summary' => [
                'topups' => $topups,
                'deposits' => $deposits,
                'library_fees' => $libraryFees,
                'total_income' => $topups + $deposits + $libraryFees,
            ],
        ]);
    }

    /**
     * Get topup transactions
     */
    public function topups(Request $request): JsonResponse
    {
        $query = Transaction::with('user:id,name,email')
            ->where('type', 'topup')
            ->where('status', 'success');

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $topups = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($topups);
    }

    /**
     * Get deposit transactions
     */
    public function deposits(Request $request): JsonResponse
    {
        $query = Transaction::with('user:id,name,email')
            ->where('type', 'deposit')
            ->where('status', 'success');

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $deposits = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($deposits);
    }

    /**
     * Get all users for librarian
     */
    public function getUsers(Request $request): JsonResponse
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by keyword
        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('email', 'like', "%{$keyword}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($users);
    }

    /**
     * Update user status
     */
    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,inactive,banned',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Người dùng không tồn tại'], 404);
        }

        // Cannot ban admin
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Không thể thay đổi trạng thái admin'], 403);
        }

        $oldStatus = $user->status;
        $user->update(['status' => $request->status]);

        // Log action
        AuditLog::log(
            auth()->id(),
            'UPDATE_USER_STATUS',
            'users',
            $user->id,
            ['status' => $oldStatus],
            ['status' => $request->status]
        );

        // Notify user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Trạng thái tài khoản thay đổi',
            'content' => 'Trạng thái tài khoản của bạn đã được cập nhật thành: ' . $request->status,
            'type' => Notification::TYPE_WEB,
        ]);

        return response()->json([
            'message' => 'Cập nhật trạng thái thành công',
            'user' => $user,
        ]);
    }

    /**
     * Reports overview for librarian
     */
    public function reportsOverview(): JsonResponse
    {
        $totalBooks = Book::count();
        $totalBorrows = BorrowRecord::count();
        $activeBorrows = BorrowRecord::where('status', 'active')->count();
        $pendingPickups = BorrowRecord::where('status', 'pending_pickup')->count();
        $overdueBorrows = BorrowRecord::where('status', 'active')
            ->where('due_date', '<', Carbon::now())
            ->count();

        return response()->json([
            'books' => [
                'total' => $totalBooks,
            ],
            'borrows' => [
                'total' => $totalBorrows,
                'active' => $activeBorrows,
                'pending_pickup' => $pendingPickups,
                'overdue' => $overdueBorrows,
            ],
        ]);
    }

    /**
     * Reports borrowings for librarian
     */
    public function reportsBorrowings(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? Carbon::now()->startOfMonth();
        $endDate = $request->end_date ?? Carbon::now()->endOfMonth();

        $borrows = BorrowRecord::with(['user:id,name', 'copy.book:id,title'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($borrows);
    }

    /**
     * Get messages for librarian
     */
    public function messages(): JsonResponse
    {
        $librarian = JWTAuth::parseToken()->authenticate();

        // Get messages sent by librarian
        $sentMessages = \App\Models\Message::where('sender_id', $librarian->id)
            ->with('receiver:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($sentMessages);
    }

    /**
     * Send message to user
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $librarian = JWTAuth::parseToken()->authenticate();

        $message = \App\Models\Message::create([
            'sender_id' => $librarian->id,
            'receiver_id' => $request->user_id,
            'title' => $request->title,
            'content' => $request->content,
            'is_read' => false,
        ]);

        // Notify user
        Notification::create([
            'user_id' => $request->user_id,
            'title' => 'Tin nhắn mới từ thủ thư: ' . $request->title,
            'content' => $request->content,
            'type' => Notification::TYPE_WEB,
        ]);

        return response()->json([
            'message' => 'Gửi tin nhắn thành công',
            'data' => $message,
        ], 201);
    }

    /**
     * Get deposit summary for librarian
     */
    public function depositSummary(): JsonResponse
    {
        // Get all active borrow records with deposits
        $activeBorrows = BorrowRecord::whereIn('status', ['active', 'overdue'])
            ->where(function ($q) {
                $q->whereNotNull('prepaid_amount')
                  ->where('prepaid_amount', '>', 0);
            })
            ->get();

        $totalDepositHeld = $activeBorrows->sum('prepaid_amount');
        $totalRecords = $activeBorrows->count();

        // Get deposits pending refund
        $pendingRefund = BorrowRecord::where('status', 'returned')
            ->where('prepaid_amount', '>', 0)
            ->whereNull('deposit_refunded_at')
            ->sum('prepaid_amount');

        // Get deposits already refunded
        $refundedDeposits = BorrowRecord::whereNotNull('deposit_refunded_at')
            ->where('prepaid_amount', '>', 0)
            ->sum('prepaid_amount');

        return response()->json([
            'total_deposit_held' => round($totalDepositHeld, 2),
            'active_borrow_records' => $totalRecords,
            'pending_refund' => round($pendingRefund, 2),
            'already_refunded' => round($refundedDeposits, 2),
        ]);
    }

    /**
     * Get borrow statistics for librarian
     */
    public function borrowStats(): JsonResponse
    {
        $today = Carbon::now()->startOfDay();
        $thisMonth = Carbon::now()->startOfMonth();

        // Total books currently borrowed
        $totalBorrowed = BorrowRecord::whereIn('status', ['active', 'overdue'])->count();

        // Overdue (not returned yet)
        $overdueCount = BorrowRecord::where('status', 'overdue')->count();

        // Borrow count this month
        $monthlyBorrows = BorrowRecord::where('borrow_date', '>=', $thisMonth)->count();

        return response()->json([
            'total_borrowed' => $totalBorrowed,
            'overdue_count' => $overdueCount,
            'monthly_borrows' => $monthlyBorrows,
        ]);
    }
}
