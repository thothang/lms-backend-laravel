<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\WithdrawalRequest;
use App\Models\RolePermission;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\Notification;
use App\Models\BorrowRecord;
use App\Services\EbookService;
use App\Events\EbookStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class AdminController extends Controller
{
    protected $ebookService;

    public function __construct(EbookService $ebookService)
    {
        $this->ebookService = $ebookService;
    }

    /**
     * Get all users
     */
    public function users(Request $request): JsonResponse
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

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
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
            'status' => 'required|in:active,locked',
        ]);

        $admin = JWTAuth::parseToken()->authenticate();
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Người dùng không tồn tại'], 404);
        }

        if ($user->id === $admin->id) {
            return response()->json(['error' => 'Không thể thay đổi trạng thái của chính mình'], 422);
        }

        $oldStatus = $user->status;
        $user->update(['status' => $request->status]);

        // Log action
        AuditLog::log(
            $admin->id,
            'UPDATE_USER_STATUS',
            'users',
            $user->id,
            ['status' => $oldStatus],
            ['status' => $request->status]
        );

        // Notify user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Thay đổi trạng thái tài khoản',
            'content' => $request->status === 'active' 
                ? 'Tài khoản của bạn đã được mở khóa' 
                : 'Tài khoản của bạn đã bị khóa',
            'type' => 'web',
        ]);

        return response()->json([
            'message' => 'Cập nhật trạng thái thành công',
        ]);
    }

    /**
     * Make a user an author
     */
    public function makeAuthor(int $id): JsonResponse
    {
        $admin = JWTAuth::parseToken()->authenticate();
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'Người dùng không tồn tại'], 404);
        }

        if ($user->role === 'author') {
            return response()->json(['error' => 'Người dùng đã là tác giả'], 422);
        }

        $oldRole = $user->role;
        $user->update(['role' => 'author']);

        // Log action
        AuditLog::log(
            $admin->id,
            'MAKE_AUTHOR',
            'users',
            $user->id,
            ['role' => $oldRole],
            ['role' => 'author']
        );

        // Notify user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Bạn đã trở thành tác giả',
            'content' => 'Chúc mừng bạn! Bạn đã được nâng cấp lên vai trò tác giả. Bây giờ bạn có thể upload và bán ebook.',
            'type' => 'web',
        ]);

        return response()->json([
            'message' => 'Nâng cấp thành tác giả thành công',
        ]);
    }

    /**
     * Get librarian permissions
     */
    public function getLibrarianPermissions(): JsonResponse
    {
        $librarians = User::where('role', 'librarian')
            ->with('rolePermission')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'permissions' => $user->rolePermission 
                        ? $user->rolePermission->getAllPermissions() 
                        : [],
                ];
            });

        return response()->json([
            'data' => $librarians,
        ]);
    }

    /**
     * Update librarian permissions
     */
    public function updateLibrarianPermissions(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.can_approve_ebook' => 'boolean',
            'permissions.can_manage_finance' => 'boolean',
            'permissions.can_manage_users' => 'boolean',
            'permissions.can_manage_books' => 'boolean',
            'permissions.can_manage_borrow_offline' => 'boolean',
            'permissions.can_manage_reservations' => 'boolean',
            'permissions.can_mark_lost_books' => 'boolean',
            'permissions.can_verify_cccd' => 'boolean',
            'permissions.can_view_reports' => 'boolean',
            'permissions.can_manage_hot_books' => 'boolean',
            'permissions.can_manage_messages' => 'boolean',
        ]);

        $admin = JWTAuth::parseToken()->authenticate();
        $user = User::find($id);

        if (!$user || !$user->isLibrarian()) {
            return response()->json(['error' => 'Thủ thư không tồn tại'], 404);
        }

        $rolePermission = $user->rolePermission ?? RolePermission::createDefault($user->id);
        $rolePermission->setPermissions($request->permissions);

        // Log action
        AuditLog::log(
            $admin->id,
            'UPDATE_Librarian_PERMISSIONS',
            'role_permissions',
            $rolePermission->id,
            null,
            $request->permissions
        );

        return response()->json([
            'message' => 'Cập nhật quyền thành công',
            'permissions' => $rolePermission->getAllPermissions(),
        ]);
    }

    /**
     * Get pending ebooks
     */
    public function pendingEbooks(): JsonResponse
    {
        $ebooks = Ebook::with('author:id,name,email')
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ebook) {
                return [
                    'id' => $ebook->id,
                    'title' => $ebook->title,
                    'author' => $ebook->author,
                    'price' => $ebook->price,
                    'is_free' => $ebook->is_free,
                    'created_at' => $ebook->created_at,
                ];
            });

        return response()->json([
            'data' => $ebooks,
        ]);
    }

    /**
     * Approve ebook
     */
    public function approveEbook(int $id): JsonResponse
    {
        $admin = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại'], 404);
        }

        if ($ebook->status !== 'pending') {
            return response()->json(['error' => 'Ebook không ở trạng thái chờ duyệt'], 422);
        }

        $this->ebookService->approveEbook($ebook);

        // Log action
        AuditLog::log(
            $admin->id,
            'APPROVE_EBOOK',
            'ebooks',
            $ebook->id,
            ['status' => 'pending'],
            ['status' => 'approved']
        );

        // Notify author about approval
        Notification::create([
            'user_id' => $ebook->author_id,
            'title' => 'Ebook đã được duyệt',
            'content' => "Ebook '{$ebook->title}' đã được duyệt và sẵn sàng để bán.",
            'type' => Notification::TYPE_WEB,
        ]);

        return response()->json([
            'message' => 'Duyệt ebook thành công',
        ]);
    }

    /**
     * Reject ebook
     */
    public function rejectEbook(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $admin = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại'], 404);
        }

        if ($ebook->status !== 'pending') {
            return response()->json(['error' => 'Ebook không ở trạng thái chờ duyệt'], 422);
        }

        $ebook->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        // Notify author
        Notification::create([
            'user_id' => $ebook->author_id,
            'title' => 'Ebook bị từ chối',
            'content' => "Ebook '{$ebook->title}' đã bị từ chối. Lý do: {$request->reason}",
            'type' => Notification::TYPE_WEB,
        ]);

        // Broadcast event
        broadcast(new EbookStatusChanged($ebook, 'rejected', $request->reason));

        // Log action
        AuditLog::log(
            $admin->id,
            'REJECT_EBOOK',
            'ebooks',
            $ebook->id,
            ['status' => 'pending'],
            ['status' => 'rejected', 'reason' => $request->reason]
        );

        return response()->json([
            'message' => 'Từ chối ebook thành công',
        ]);
    }

    /**
     * Get withdrawal requests
     */
    public function withdrawalRequests(Request $request): JsonResponse
    {
        $query = WithdrawalRequest::with('author:id,name,email');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($requests);
    }

    /**
     * Get all ebook purchase earnings (for admin)
     */
    public function ebookEarnings(Request $request): JsonResponse
    {
        $authorPercent = config('library.ebook_author_revenue_percent', 60);

        $query = EbookPurchase::with(['ebook:id,title,price,author_id,author_name', 'user:id,name,email'])
            ->whereHas('ebook', function ($q) {
                $q->whereNotNull('author_id');
            })
            ->orderBy('purchase_date', 'desc');

        // Filter by author if specified
        if ($request->has('author_id')) {
            $query->whereHas('ebook', function ($q) use ($request) {
                $q->where('author_id', $request->author_id);
            });
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('purchase_date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('purchase_date', '<=', $request->to_date);
        }

        $purchases = $query->paginate(50);

        $data = $purchases->getCollection()->map(function ($purchase) use ($authorPercent) {
            $totalAmount = (float) $purchase->amount;
            $authorEarnings = ($totalAmount * $authorPercent) / 100;
            $platformFee = $totalAmount - $authorEarnings;

            return [
                'id' => $purchase->id,
                'ebook_title' => $purchase->ebook->title,
                'ebook_id' => $purchase->ebook->id,
                'author_id' => $purchase->ebook->author_id,
                'author_name' => $purchase->ebook->author ? $purchase->ebook->author->name : $purchase->ebook->author_name,
                'buyer_name' => $purchase->user->name,
                'buyer_email' => $purchase->user->email,
                'purchase_date' => $purchase->purchase_date->format('Y-m-d H:i'),
                'total_amount' => $totalAmount,
                'platform_fee' => round($platformFee, 2),
                'author_earnings' => round($authorEarnings, 2),
                'author_percent' => $authorPercent,
            ];
        });

        return response()->json([
            'author_percent' => $authorPercent,
            'data' => $data,
            'pagination' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
        ]);
    }

    /**
     * Get summary earnings by author (for admin)
     */
    public function authorEarningsSummary(Request $request): JsonResponse
    {
        $authorPercent = config('library.ebook_author_revenue_percent', 60);

        // Get earnings by author
        $earnings = User::where('role', 'author')
            ->withCount(['ebooks as total_ebooks' => function ($query) {
                $query->where('status', 'approved');
            }])
            ->withSum(['purchases as buyer' => function ($query) {
                // This won't work directly, need different approach
            }], 'amount')
            ->get();

        // Calculate from purchases
        $authors = User::where('role', 'author')
            ->get()
            ->map(function ($author) use ($authorPercent) {
                $totalRevenue = $author->ebooks()
                    ->whereNotNull('author_id')
                    ->with('purchases')
                    ->get()
                    ->sum(function ($ebook) {
                        return $ebook->purchases->sum('amount');
                    });

                return [
                    'author_id' => $author->id,
                    'author_name' => $author->name,
                    'total_ebooks' => $author->ebooks()->where('status', 'approved')->count(),
                    'total_revenue' => round($totalRevenue, 2),
                    'author_earnings' => round(($totalRevenue * $authorPercent) / 100, 2),
                    'platform_fee' => round($totalRevenue - ($totalRevenue * $authorPercent) / 100, 2),
                ];
            });

        return response()->json([
            'author_percent' => $authorPercent,
            'data' => $authors,
        ]);
    }

    /**
     * Get admin revenue summary (including ebook commission)
     */
    public function revenue(): JsonResponse
    {
        $authorPercent = config('library.ebook_author_revenue_percent', 60);
        $platformPercent = 100 - $authorPercent;

        // Calculate ebook revenue
        $totalEbookRevenue = EbookPurchase::whereHas('ebook', function ($q) {
            $q->whereNotNull('author_id');
        })->sum('amount');

        // Calculate ebook commission for platform
        $ebookCommission = ($totalEbookRevenue * $platformPercent) / 100;

        // Other income sources (these would need to be calculated from actual tables)
        $borrowFeeIncome = 0;
        $penaltyIncome = 0;
        $reservationIncome = 0;
        $depositIncome = 0;

        // Calculate from borrow records
        $borrowRecords = \App\Models\BorrowRecord::whereNotNull('actual_fee')->get();
        foreach ($borrowRecords as $record) {
            $borrowFeeIncome += (float) $record->actual_fee;
        }

        // Calculate penalties
        $penalties = \App\Models\PaymentTransaction::where('type', 'penalty')->sum('amount');
        $penaltyIncome = $penalties;

        $totalIncome = $totalEbookRevenue + $borrowFeeIncome + $penaltyIncome;

        return response()->json([
            'earnings_balance' => 0,
            'total_earned' => $totalEbookRevenue,
            'withdrawn' => 0,
            'available_to_withdraw' => $ebookCommission,
            'breakdown' => [
                'ebook_income' => $totalEbookRevenue,
                'author_ebook_commission' => $ebookCommission,
                'borrow_fee_income' => $borrowFeeIncome,
                'penalty_income' => $penaltyIncome,
                'reservation_income' => $reservationIncome,
                'deposit_income' => $depositIncome,
                'total_income' => $totalIncome,
            ],
        ]);
    }

    /**
     * Get deposit summary for admin
     */
    public function depositSummary(): JsonResponse
    {
        // Get all active borrow records with deposits
        $activeBorrows = BorrowRecord::whereIn('status', ['active', 'returned', 'overdue'])
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
     * Get borrow statistics for admin
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

    /**
     * Process withdrawal request
     */
    public function processWithdrawal(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:500',
        ]);

        $admin = JWTAuth::parseToken()->authenticate();
        $withdrawal = WithdrawalRequest::find($id);

        if (!$withdrawal) {
            return response()->json(['error' => 'Yêu cầu không tồn tại'], 404);
        }

        if ($withdrawal->status !== 'pending') {
            return response()->json(['error' => 'Yêu cầu đã được xử lý'], 422);
        }

        if ($request->action === 'approve') {
            $withdrawal->approve($request->notes);
            
            // In production, here you would initiate bank transfer
            // For now, just mark as completed
            $withdrawal->markCompleted();
        } else {
            $withdrawal->reject($request->notes);
        }

        // Notify author
        Notification::create([
            'user_id' => $withdrawal->author_id,
            'title' => $request->action === 'approve' ? 'Yêu cầu rút tiền được duyệt' : 'Yêu cầu rút tiền bị từ chối',
            'content' => $request->action === 'approve'
                ? "Yêu cầu rút tiền " . number_format($withdrawal->amount) . " VNĐ đã được duyệt và chuyển thành công."
                : "Yêu cầu rút tiền " . number_format($withdrawal->amount) . " VNĐ đã bị từ chối. " . ($request->notes ? "Lý do: {$request->notes}" : "Số tiền đã được hoàn vào tài khoản."),
            'type' => Notification::TYPE_WEB,
        ]);

        // Log action
        AuditLog::log(
            $admin->id,
            strtoupper($request->action) . '_WITHDRAWAL',
            'withdrawal_requests',
            $withdrawal->id,
            ['status' => 'pending'],
            ['status' => $request->action === 'approve' ? 'completed' : 'rejected']
        );

        return response()->json([
            'message' => 'Xử lý yêu cầu thành công',
        ]);
    }

    /**
     * Get settings
     */
    public function settings(): JsonResponse
    {
        $settings = [
            'default_daily_fee' => Setting::get('default_daily_fee'),
            'deposit_percent' => Setting::get('deposit_percent'),
            'max_deposit_amount' => Setting::get('max_deposit_amount'),
            'max_borrow_per_user' => Setting::get('max_borrow_per_user'),
            'max_renew_count' => Setting::get('max_renew_count'),
            'overdue_penalty_multiplier' => Setting::get('overdue_penalty_multiplier'),
            'reservation_fee_percent' => Setting::get('reservation_fee_percent'),
            'ebook_author_revenue_percent' => Setting::get('ebook_author_revenue_percent'),
            'min_withdrawal_amount' => Setting::get('min_withdrawal_amount'),
            'author_withdrawal_threshold_percent' => Setting::get('author_withdrawal_threshold_percent'),
        ];

        return response()->json($settings);
    }

    /**
     * Update settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'default_daily_fee' => 'sometimes|numeric|min:0',
            'deposit_percent' => 'sometimes|numeric|min:0|max:100',
            'max_deposit_amount' => 'sometimes|numeric|min:0',
            'max_borrow_per_user' => 'sometimes|integer|min:1',
            'max_renew_count' => 'sometimes|integer|min:0',
            'overdue_penalty_multiplier' => 'sometimes|numeric|min:0',
            'reservation_fee_percent' => 'sometimes|numeric|min:0|max:100',
            'ebook_author_revenue_percent' => 'sometimes|numeric|min:0|max:100',
            'min_withdrawal_amount' => 'sometimes|numeric|min:0',
            'author_withdrawal_threshold_percent' => 'sometimes|numeric|min:0|max:100',
        ]);

        // Save to database
        foreach ($request->all() as $key => $value) {
            Setting::set($key, $value);
        }

        // Log action
        AuditLog::log(
            auth()->id(),
            'UPDATE_SETTINGS',
            'settings',
            0,
            null,
            $request->all()
        );

        return response()->json([
            'message' => 'Cập nhật cấu hình thành công',
        ]);
    }

    /**
     * Get audit logs
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('table_name')) {
            $query->where('table_name', $request->table_name);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json($logs);
    }

    /**
     * Upload ebook by admin (directly publish, revenue goes to admin 100%)
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
            'author_name' => 'required|string|max:255', // Required for admin uploads
        ]);

        $admin = JWTAuth::parseToken()->authenticate();
        $data = $request->except(['file', 'cover_image']);
        $data['is_free'] = $request->is_free == '1';
        
        // Handle file upload
        $file = $request->file('file');
        $path = $file->store('ebooks/admin_' . $admin->id, 'local');

        // Handle cover image
        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = $request->file('cover_image')->store('covers/ebooks', 'public');
        }

        // Create ebook with approved status
        // author_id = admin's id (to check uploader role in purchase logic)
        // author_name = the actual author name (display only, not a user account)
        // uploaded_by_admin = true (indicates this is a library ebook, 100% revenue to admin)
        $ebook = Ebook::create([
            'title' => $data['title'],
            'author_id' => $admin->id, // Admin's ID for role checking
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
            $admin->id,
            'ADMIN_UPLOAD_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['title' => $ebook->title, 'author_name' => $request->author_name]
        );

        return response()->json([
            'message' => 'Ebook đã được tải lên và xuất bản thành công',
            'ebook_id' => $ebook->id,
        ], 201);
    }

    /**
     * Get admin revenue summary
     */
    public function getRevenue(): JsonResponse
    {
        try {
            $admin = JWTAuth::parseToken()->authenticate();

            if (!$admin) {
                return response()->json(['error' => 'Không tìm thấy người dùng'], 401);
            }

            // Get admin user info
            $adminUser = User::find($admin->id);

            if (!$adminUser) {
                return response()->json(['error' => 'Không tìm thấy tài khoản admin'], 404);
            }

            // 1. Ebook income (admin uploaded ebooks - 100% goes to admin)
            $ebookTransactions = \App\Models\Transaction::where('type', 'ebook_purchase')
                ->where('status', 'success')
                ->get()
                ->filter(function ($t) {
                    $metadata = is_array($t->metadata) ? $t->metadata : [];
                    return !empty($metadata['uploaded_by_admin']);
                });
            $ebookIncome = $ebookTransactions->sum('amount');

            // 2. Author ebook commission (admin gets 40% from author-uploaded ebooks)
            $authorEbookTransactions = \App\Models\Transaction::where('type', 'ebook_purchase')
                ->where('status', 'success')
                ->get()
                ->filter(function ($t) {
                    $metadata = is_array($t->metadata) ? $t->metadata : [];
                    return empty($metadata['uploaded_by_admin']) && !empty($metadata['author_id']);
                });
            $authorEbookCommission = $authorEbookTransactions->sum('amount') * 0.4; // 40% goes to admin

            // 3. Borrow fee income (from library_fee_income transactions)
            $borrowFeeIncome = \App\Models\Transaction::where('type', 'library_fee_income')
                ->where('status', 'success')
                ->sum('amount');

            // 4. Penalty income (from overdue penalties)
            $penaltyIncome = \App\Models\Transaction::where('type', 'penalty')
                ->where('status', 'success')
                ->sum('amount');

            // 5. Reservation income (from reservation deposits - non-refundable)
            $reservationIncome = \App\Models\Transaction::where('type', 'deposit')
                ->where('status', 'success')
                ->whereNotNull('metadata')
                ->get()
                ->filter(function ($t) {
                    $metadata = is_array($t->metadata) ? $t->metadata : [];
                    return isset($metadata['reservation_id']);
                })
                ->sum('amount');

            // 6. Confiscated deposit income (from deposit_hold that was not refunded - e.g., lost books)
            $depositIncome = \App\Models\Transaction::where('type', 'deposit_hold')
                ->where('status', 'success')
                ->get()
                ->filter(function ($t) {
                    $metadata = is_array($t->metadata) ? $t->metadata : [];
                    return isset($metadata['borrow_id']);
                })
                ->sum('amount');

            // Subtract returned deposits (refunds) to get actual confiscated amount
            $refundedDeposits = \App\Models\Transaction::where('type', 'deposit_refund')
                ->where('status', 'success')
                ->get()
                ->filter(function ($t) {
                    $metadata = is_array($t->metadata) ? $t->metadata : [];
                    return isset($metadata['borrow_id']);
                })
                ->sum('amount');

            // Actual confiscated = total held - refunded
            $actualConfiscated = $depositIncome - $refundedDeposits;
            if ($actualConfiscated < 0) $actualConfiscated = 0;

            // Calculate total income from all sources
            $totalIncome = $ebookIncome + $authorEbookCommission + $borrowFeeIncome + $penaltyIncome + $reservationIncome + $actualConfiscated;

            // Total revenue from admin's earnings balance
            $totalEarnings = $adminUser->earnings_balance ?? 0;
            $totalEarned = $adminUser->total_earned ?? 0;

            // Admin withdrawals (admin can withdraw from earnings)
            $withdrawnAmount = \App\Models\WithdrawalRequest::where('author_id', $admin->id)
                ->where('status', 'completed')
                ->sum('amount');

            // Recent transactions
            $recentEbookSales = $ebookTransactions->take(20)->map(function ($t) {
                $metadata = is_array($t->metadata) ? $t->metadata : [];
                return [
                    'id' => $t->id,
                    'type' => 'ebook_sale',
                    'amount' => $t->amount,
                    'description' => 'Bán ebook: ' . ($metadata['ebook_title'] ?? 'N/A'),
                    'buyer_id' => $t->user_id,
                    'created_at' => $t->created_at,
                ];
            })->values();

            return response()->json([
                'earnings_balance' => $totalEarnings,
                'total_earned' => $totalEarned,
                'withdrawn' => $withdrawnAmount,
                'available_to_withdraw' => $totalEarnings,
                'breakdown' => [
                    'ebook_income' => $ebookIncome,
                    'author_ebook_commission' => $authorEbookCommission,
                    'borrow_fee_income' => $borrowFeeIncome,
                    'penalty_income' => $penaltyIncome,
                    'reservation_income' => $reservationIncome,
                    'deposit_income' => $actualConfiscated,
                    'total_income' => $totalIncome,
                ],
                'recent_transactions' => $recentEbookSales,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi server',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
