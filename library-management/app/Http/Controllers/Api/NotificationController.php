<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Tymon\JWTAuth\Facades\JWTAuth;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json(['error' => 'Thông báo không tồn tại'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Đã đánh dấu đã đọc',
        ]);
    }
}
