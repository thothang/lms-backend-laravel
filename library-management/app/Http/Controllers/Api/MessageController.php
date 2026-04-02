<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Models\AuditLog;
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
            ->with(['fromUser:id,name', 'toUser:id,name']);

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
            'to_user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:2000',
        ]);

        $sender = JWTAuth::parseToken()->authenticate();

        // Cannot send to self
        if ($sender->id === $request->to_user_id) {
            return response()->json(['error' => 'Không thể gửi tin nhắn cho chính mình'], 422);
        }

        // Check if recipient exists
        $recipient = User::find($request->to_user_id);
        if (!$recipient) {
            return response()->json(['error' => 'Người nhận không tồn tại'], 404);
        }

        $message = Message::create([
            'from_user_id' => $sender->id,
            'to_user_id' => $request->to_user_id,
            'message' => $request->message,
            'is_read' => false,
        ]);

        // Broadcast event
        broadcast(new NewMessage($message, $recipient));

        return response()->json([
            'message' => 'Gửi tin nhắn thành công',
            'data' => $message->load(['fromUser:id,name', 'toUser:id,name']),
        ], 201);
    }

    /**
     * Mark message as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $message = Message::where('id', $id)
            ->where('to_user_id', $user->id)
            ->first();

        if (!$message) {
            return response()->json(['error' => 'Tin nhắn không tồn tại'], 404);
        }

        $message->markAsRead();

        return response()->json([
            'message' => 'Đã đánh dấu đã đọc',
        ]);
    }
}
