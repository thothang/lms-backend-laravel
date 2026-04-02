<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Ebook;
use App\Models\WithdrawalRequest;
use App\Models\RolePermission;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\Notification;
use App\Services\EbookService;
use App\Events\EbookStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

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
            'type' => 'web',
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
            'title' => 'Yêu cầu rút tiền',
            'content' => $request->action === 'approve'
                ? "Yêu cầu rút tiền " . number_format($withdrawal->amount) . " VNĐ đã được duyệt."
                : "Yêu cầu rút tiền đã bị từ chối. Số tiền đã được hoàn vào tài khoản.",
            'type' => 'web',
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
            'default_daily_fee' => config('library.default_daily_fee'),
            'deposit_percent' => config('library.deposit_percent'),
            'max_deposit_amount' => config('library.max_deposit_amount'),
            'max_borrow_per_user' => config('library.max_borrow_per_user'),
            'max_renew_count' => config('library.max_renew_count'),
            'overdue_penalty_multiplier' => config('library.overdue_penalty_multiplier'),
            'reservation_fee_percent' => config('library.reservation_fee_percent'),
            'ebook_author_revenue_percent' => config('library.ebook_author_revenue_percent'),
            'min_withdrawal_amount' => config('library.min_withdrawal_amount'),
            'author_withdrawal_threshold_percent' => config('library.author_withdrawal_threshold_percent'),
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
            JWTAuth::parseToken()->id(),
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
}
