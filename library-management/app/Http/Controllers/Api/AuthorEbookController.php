<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use App\Models\WithdrawalRequest;
use App\Models\AuditLog;
use App\Services\EbookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Storage;

class AuthorEbookController extends Controller
{
    protected $ebookService;

    public function __construct(EbookService $ebookService)
    {
        $this->ebookService = $ebookService;
    }

    /**
     * Upload a new ebook
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required_without:is_free|numeric|min:0',
            'is_free' => 'boolean',
            'file' => 'required|file|mimes:pdf|max:51200', // max 50MB
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->isAuthor()) {
            return response()->json([
                'error' => 'Bạn cần là tác giả để upload ebook',
            ], 403);
        }

        $result = $this->ebookService->uploadEbook($user, $request->all(), $request->file('file'));

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message'],
            ], 422);
        }

        return response()->json([
            'message' => 'Ebook đã được gửi đi duyệt',
            'ebook_id' => $result['ebook_id'],
            'status' => 'pending',
        ], 201);
    }

    /**
     * Get author's ebooks
     */
    public function index(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $ebooks = Ebook::where('author_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ebook) {
                return [
                    'id' => $ebook->id,
                    'title' => $ebook->title,
                    'price' => $ebook->price,
                    'is_free' => $ebook->is_free,
                    'status' => $ebook->status,
                    'purchase_count' => $ebook->purchase_count,
                    'created_at' => $ebook->created_at,
                ];
            });

        return response()->json([
            'data' => $ebooks,
        ]);
    }

    /**
     * Update ebook metadata
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'is_free' => 'sometimes|boolean',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::where('id', $id)
            ->where('author_id', $user->id)
            ->first();

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc bạn không có quyền sửa',
            ], 404);
        }

        // Can only update pending ebooks or update metadata for approved ones
        if ($ebook->status === 'rejected') {
            return response()->json([
                'error' => 'Ebook đã bị từ chối, không thể sửa',
            ], 422);
        }

        $ebook->update($request->only(['title', 'description', 'price', 'is_free']));

        return response()->json([
            'message' => 'Cập nhật thành công',
            'ebook' => $ebook,
        ]);
    }

    /**
     * Get author earnings
     */
    public function earnings(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->isAuthor()) {
            return response()->json([
                'error' => 'Bạn cần là tác giả để xem doanh thu',
            ], 403);
        }

        return response()->json([
            'balance' => $user->earnings_balance,
            'total_earned' => $user->total_earned,
            'min_withdrawal' => config('library.min_withdrawal_amount', 100000),
            'can_withdraw' => $user->earnings_balance >= config('library.min_withdrawal_amount', 100000),
        ]);
    }

    /**
     * Request withdrawal
     */
    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'bank_account' => 'required|string',
            'bank_name' => 'required|string',
            'account_holder' => 'required|string',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->isAuthor()) {
            return response()->json([
                'error' => 'Bạn cần là tác giả để rút tiền',
            ], 403);
        }

        $amount = $request->amount;

        // Check minimum withdrawal
        $minWithdrawal = config('library.min_withdrawal_amount', 100000);
        if ($amount < $minWithdrawal) {
            return response()->json([
                'error' => "Số tiền rút tối thiểu là " . number_format($minWithdrawal) . " VNĐ",
            ], 422);
        }

        // Check balance
        if ($user->earnings_balance < $amount) {
            return response()->json([
                'error' => 'Số dư không đủ',
            ], 422);
        }

        // Check withdrawal threshold
        $thresholdPercent = config('library.author_withdrawal_threshold_percent', 70);
        $requiresApproval = ($amount / $user->total_earned) > ($thresholdPercent / 100);

        // Deduct from earnings_balance
        $user->subtractEarnings($amount);

        // Create withdrawal request
        $withdrawal = WithdrawalRequest::create([
            'author_id' => $user->id,
            'amount' => $amount,
            'bank_account_info' => [
                'bank_account' => $request->bank_account,
                'bank_name' => $request->bank_name,
                'account_holder' => $request->account_holder,
            ],
            'status' => $requiresApproval ? 'pending' : 'approved',
        ]);

        // Log action
        AuditLog::log(
            $user->id,
            'WITHDRAWAL_REQUEST',
            'withdrawal_requests',
            $withdrawal->id,
            null,
            ['amount' => $amount, 'requires_approval' => $requiresApproval]
        );

        return response()->json([
            'message' => $requiresApproval 
                ? 'Yêu cầu rút tiền đã được gửi, chờ admin duyệt'
                : 'Yêu cầu rút tiền đã được xử lý',
            'withdrawal_id' => $withdrawal->id,
            'amount' => $amount,
            'status' => $withdrawal->status,
        ]);
    }
}
