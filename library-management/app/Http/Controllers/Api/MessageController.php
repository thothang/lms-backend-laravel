<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\NewMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class MessageController extends Controller
{
    /**
     * Get user's messages
     */
    public function index(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $query = Message::forUser($user->id)
            ->with(['sender:id,name', 'receiver:id,name']);

        // Filter
        if ($request->type === 'received') {
            $query->receivedBy($user->id);
        } elseif ($request->type === 'sent') {
            $query->sentBy($user->id);
        }

        // Unread first
        $messages = $query->orderByRaw('is_read ASC, created_at DESC')
            ->paginate(20);

        return response()->json($messages);
    }

    /**
     * Send a message
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required_without:to_user_id|exists:users,id',
            'to_user_id' => 'required_without:user_id|exists:users,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:2000',
        ]);

        $sender = JWTAuth::parseToken()->authenticate();
        $receiverId = $request->user_id ?? $request->to_user_id;

        // Cannot send to self
        if ($sender->id == $receiverId) {
            return response()->json(['error' => 'Không thể gửi tin nhắn cho chính mình'], 422);
        }

        // Check if recipient exists
        $recipient = User::find($receiverId);
        if (!$recipient) {
            return response()->json(['error' => 'Người nhận không tồn tại'], 404);
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiverId,
            'title' => $request->title,
            'content' => $request->content,
            'is_read' => false,
        ]);

        // Create notification for recipient
        Notification::create([
            'user_id' => $receiverId,
            'title' => 'Tin nhắn mới: ' . $request->title,
            'content' => $request->content,
            'type' => Notification::TYPE_WEB,
        ]);

        // Broadcast event
        broadcast(new NewMessage($message, $recipient));

        return response()->json([
            'message' => 'Gửi tin nhắn thành công',
            'data' => $message->load(['sender:id,name', 'receiver:id,name']),
        ], 201);
    }

    /**
     * Mark message as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $message = Message::where('id', $id)
            ->where('receiver_id', $user->id)
            ->first();

        if (!$message) {
            return response()->json(['error' => 'Tin nhắn không tồn tại'], 404);
        }

        $message->markAsRead();

        return response()->json([
            'message' => 'Đã đánh dấu đã đọc',
        ]);
    }

    /**
     * Get unread message count
     */
    public function unreadCount(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $count = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark all messages as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'Đã đánh dấu tất cả là đã đọc',
        ]);
    }
}
