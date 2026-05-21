<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RolePermission;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get all users
     */
    public function users(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $safeParams = $request->only(['role', 'status', 'search', 'page', 'limit']);
            $cacheKey = 'admin.users.' . md5(json_encode($safeParams));
            
            return response()->json(
                Cache::remember($cacheKey, 300, function() use ($request) {
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

                    $limit = $request->input('limit', 20);
                    $users = $query->orderBy('created_at', 'desc')->paginate($limit);
                    return $users;
                })
            );
        }, 'Không thể lấy danh sách người dùng');
    }

    /**
     * Update user status
     */
    public function updateUserStatus(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
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

            // Clear all admin users cache
            Cache::forget('admin.users');
            if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                $redis = Cache::getStore()->connection();
                $keys = $redis->keys('admin.users.*');
                foreach ($keys as $key) {
                    Cache::forget($key);
                }
            }

            return response()->json([
                'message' => 'Cập nhật trạng thái thành công',
            ]);
        }, 'Không thể cập nhật trạng thái người dùng');
    }

    /**
     * Make a user an author
     */
    public function makeAuthor(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
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

            // Clear all admin users cache
            Cache::forget('admin.users');
            if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                $redis = Cache::getStore()->connection();
                $keys = $redis->keys('admin.users.*');
                foreach ($keys as $key) {
                    Cache::forget($key);
                }
            }

            return response()->json([
                'message' => 'Nâng cấp thành tác giả thành công',
            ]);
        }, 'Không thể nâng cấp thành tác giả');
    }

    /**
     * Get librarian permissions
     */
    public function getLibrarianPermissions(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
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
        }, 'Không thể lấy quyền thủ thư');
    }

    /**
     * Update librarian permissions
     */
    public function updateLibrarianPermissions(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
            $request->validate([
                'permissions' => 'required|array',
                'permissions.can_approve_ebook' => 'boolean',
                'permissions.can_manage_finance' => 'boolean',
                'permissions.can_manage_users' => 'boolean',
                'permissions.can_manage_books' => 'boolean',
                'permissions.can_manage_borrow_offline' => 'boolean',
                'permissions.can_manage_reservations' => 'boolean',
                'permissions.can_mark_lost_books' => 'boolean',
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

            // Clear librarian permissions cache
            Cache::forget('admin.librarian_permissions');

            return response()->json([
                'message' => 'Cập nhật quyền thành công',
                'permissions' => $rolePermission->getAllPermissions(),
            ]);
        }, 'Không thể cập nhật quyền thủ thư');
    }
}
