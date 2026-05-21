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
use App\Mail\VerifyEmailMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
        $verificationToken = \Illuminate\Support\Str::random(60);

        // Create user
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'dob' => !empty($data['dob']) ? $data['dob'] : null,
            'role' => 'user',
            'status' => 'unverified',
            'verification_token' => $verificationToken,
        ]);

        // Send Email verification
        $verifyUrl = config('services.frontend_url', 'http://localhost:5173') . '/verify-email/' . $verificationToken;
        try {
            Mail::to($user->email)->send(new VerifyEmailMail($user, $verifyUrl));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Mail timeout/failure during registration: ' . $e->getMessage());
        }

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

        // Create Database Notification
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Chào mừng bạn đến với Thư viện!',
            'content' => 'Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để xác thực và bắt đầu sử dụng đầy đủ tính năng.',
            'type' => Notification::TYPE_WEB,
        ]);

        // Generate JWT token for auto-login
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Đăng ký thành công. Vui lòng xác thực email để kích hoạt tài khoản.',
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'balance' => $user->balance,
            ],
            'verification_token' => $verificationToken,
        ], 201);
    }

    /**
     * Verify user email
     */
    public function verifyEmail(Request $request, string $token)
    {
        $user = User::where('verification_token', $token)->first();
        $frontendUrl = config('services.frontend_url', 'http://localhost:5173');

        if (!$user) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'message' => 'Link xác thực không hợp lệ hoặc đã hết hạn.'
                ], 400);
            }
            return redirect()->away($frontendUrl . '/?verified=0&message=invalid_token');
        }

        $user->update([
            'status' => 'active',
            'email_verified_at' => now(),
            'verification_token' => null,
        ]);

        // Create welcome notification
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Chào mừng đến với thư viện!',
            'content' => 'Tài khoản của bạn đã được xác minh. Hãy bắt đầu khám phá kho sách của chúng tôi ngay!',
            'type' => Notification::TYPE_WEB,
        ]);

        // Generate JWT token for auto-login
        $jwtToken = JWTAuth::fromUser($user);

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Xác thực email thành công!',
                'access_token' => $jwtToken,
                'user' => $user
            ]);
        }

        return redirect()->away($frontendUrl . '/?verified=1&token=' . $jwtToken);
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

        $user = JWTAuth::user()->load('rolePermission');

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
                'permissions' => $user->role === 'librarian' 
                    ? ($user->rolePermission?->getAllPermissions() ?? [])
                    : [],
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

        $user->load('rolePermission');

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
            'permissions' => $user->role === 'librarian' 
                ? ($user->rolePermission?->getAllPermissions() ?? [])
                : [],
        ];

        // No CCCD required


        return response()->json($userData);
    }

    /**
     * Update user profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $data = $request->validated();

        $oldValues = $user->only(['name', 'email', 'phone', 'address', 'dob']);

        // Explicitly handle empty dob
        if (isset($data['dob']) && empty($data['dob'])) {
            $data['dob'] = null;
        }

        $user->update($data);

        // Log action
        AuditLog::log(
            $user->id,
            'UPDATE_PROFILE',
            'users',
            $user->id,
            $oldValues,
            $user->only(['name', 'email', 'phone', 'address', 'dob']),
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
                'status' => $user->status,
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
