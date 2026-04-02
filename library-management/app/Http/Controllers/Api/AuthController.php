<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Models\User;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Handle CCCD image upload
        $cccdImagePath = null;
        if ($request->hasFile('cccd_image')) {
            $cccdImagePath = $request->file('cccd_image')->store('cccd_images', 'private');
        }

        // Create user
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'cccd_number' => $data['cccd_number'] ?? null,
            'cccd_image' => $cccdImagePath,
            'dob' => $data['dob'] ?? null,
            'role' => 'user',
            'status' => 'unverified',
        ]);

        // Create notification
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Chào mừng bạn đến với Thư viện!',
            'content' => 'Tài khoản của bạn đã được tạo. Vui lòng chờ quản trị viên xác minh CCCD để kích hoạt tài khoản.',
            'type' => 'web',
        ]);

        // Log action
        AuditLog::log(
            $user->id,
            'USER_REGISTER',
            'users',
            $user->id,
            null,
            ['status' => 'unverified', 'role' => 'user'],
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Đăng ký thành công. Chờ duyệt CCCD.',
            'user_id' => $user->id,
            'status' => $user->status,
        ], 201);
    }

    /**
     * Login user and return JWT token
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'error' => 'Email hoặc mật khẩu không đúng',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Không thể tạo token',
            ], 500);
        }

        $user = JWTAuth::user();

        // Check if account is locked
        if ($user->status === 'locked') {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'error' => 'Tài khoản đã bị khóa',
            ], 403);
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'balance' => $user->balance,
            ],
        ]);
    }

    /**
     * Logout user (invalidate token)
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'message' => 'Đăng xuất thành công',
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Không thể đăng xuất',
            ], 500);
        }
    }

    /**
     * Refresh JWT token
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Không thể làm mới token',
            ], 401);
        }
    }

    /**
     * Get current authenticated user profile
     */
    public function me(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'dob' => $user->dob,
            'role' => $user->role,
            'status' => $user->status,
            'balance' => $user->balance,
            'total_debt' => $user->total_debt,
        ];

        // Admin can see full CCCD info
        if ($request->user()->isAdmin() || $request->user()->id === $user->id) {
            $userData['cccd_number'] = $user->getDecryptedCccdNumber();
        }

        return response()->json($userData);
    }

    /**
     * Update user profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $data = $request->validated();

        // Handle CCCD image upload
        if ($request->hasFile('cccd_image')) {
            // Delete old image
            if ($user->cccd_image) {
                Storage::disk('private')->delete($user->cccd_image);
            }
            $data['cccd_image'] = $request->file('cccd_image')->store('cccd_images', 'private');
        }

        $oldValues = $user->only(['name', 'phone', 'address', 'dob', 'cccd_number', 'cccd_image']);

        $user->update($data);

        // Log action
        AuditLog::log(
            $user->id,
            'UPDATE_PROFILE',
            'users',
            $user->id,
            $oldValues,
            $user->only(['name', 'phone', 'address', 'dob', 'cccd_image']),
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Cập nhật profile thành công',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'dob' => $user->dob,
            ],
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $data = $request->validated();

        // Verify current password
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'error' => 'Mật khẩu hiện tại không đúng',
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($data['new_password']),
        ]);

        // Invalidate all tokens (force re-login)
        JWTAuth::invalidate(JWTAuth::getToken());

        // Log action
        AuditLog::log(
            $user->id,
            'CHANGE_PASSWORD',
            'users',
            $user->id,
            null,
            null,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
        ]);
    }

    /**
     * Forgot password - send reset email
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Generate token and send email
        // For now, we'll just return success (in production, send actual email)
        // We can use Laravel's built-in password reset functionality

        return response()->json([
            'message' => 'Link đặt lại mật khẩu đã được gửi đến email của bạn',
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // In production, use Laravel's password reset functionality
        // For now, we'll implement a simple version

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'Email không tồn tại',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Log action
        AuditLog::log(
            $user->id,
            'RESET_PASSWORD',
            'users',
            $user->id,
            null,
            null,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'message' => 'Mật khẩu đã được đặt lại',
        ]);
    }

    /**
     * Get balance
     */
    public function balance(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        return response()->json([
            'balance' => $user->balance,
            'earnings_balance' => $user->earnings_balance,
            'total_debt' => $user->total_debt,
        ]);
    }
}
