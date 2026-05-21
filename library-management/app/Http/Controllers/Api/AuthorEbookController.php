<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\Notification;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\EbookService;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuthorEbookController extends Controller
{
    use HandlesApiExceptions;

    protected $ebookService;

    public function __construct(EbookService $ebookService)
    {
        $this->ebookService = $ebookService;
    }

    /**
     * Upload a new ebook
     */
    public function store(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'title' => 'required|string|max:255',
                'category_id' => 'required|exists:book_categories,id',
                'description' => 'nullable|string',
                'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
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

            // Notify admin about new ebook submission
            $admin = \App\Models\User::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Ebook mới chờ duyệt',
                    'content' => "Tác giả {$user->name} đã gửi ebook mới '{$request->title}' chờ được duyệt.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            // Clear admin pending ebooks cache
            Cache::forget('admin.pending_ebooks');

            return response()->json([
                'message' => 'Ebook đã được gửi đi duyệt',
                'ebook_id' => $result['ebook_id'],
                'status' => 'pending',
            ], 201);
        }, 'Không thể upload ebook');
    }

    /**
     * Get author's ebooks
     */
    public function index(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $user = JWTAuth::parseToken()->authenticate();

            $baseUrl = config('app.url');

            $ebooks = Ebook::where('author_id', $user->id)
                ->with('category:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($ebook) use ($baseUrl) {
                    // Ensure full URL for cover image
                    $coverImage = $ebook->cover_image;
                    if ($coverImage && !str_starts_with($coverImage, 'http')) {
                        $coverImage = rtrim($baseUrl, '/') . '/' . ltrim($coverImage, '/');
                    }

                    return [
                        'id' => $ebook->id,
                        'title' => $ebook->title,
                        'cover_image' => $coverImage,
                        'category' => $ebook->category ? [
                            'id' => $ebook->category->id,
                            'name' => $ebook->category->name,
                        ] : null,
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
        }, 'Không thể lấy danh sách ebook');
    }

    /**
     * Update ebook metadata
     */
    public function update(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
            $request->validate([
                'title' => 'sometimes|string|max:255',
                'category_id' => 'sometimes|exists:book_categories,id',
                'description' => 'nullable|string',
                'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
                'price' => 'sometimes|numeric|min:0',
                'is_free' => 'sometimes|boolean',
                'file' => 'nullable|file|mimes:pdf|max:51200',
                'free_preview_pages' => 'nullable|integer|min:0',
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

            $updateData = $request->only(['title', 'category_id', 'description', 'price', 'free_preview_pages']);

            if ($request->has('is_free')) {
                $updateData['is_free'] = filter_var($request->is_free, FILTER_VALIDATE_BOOLEAN);
            }

            // Handle cover image
            if ($request->hasFile('cover_image')) {
                // Delete old cover (get raw value to avoid accessor)
                $oldCover = $ebook->getRawOriginal('cover_image');
                if ($oldCover && Storage::disk('public')->exists($oldCover)) {
                    Storage::disk('public')->delete($oldCover);
                }
                $updateData['cover_image'] = $request->file('cover_image')->store('covers/ebooks', 'public');
            }

            // Handle PDF file replacement
            if ($request->hasFile('file')) {
                // Delete old file
                if ($ebook->file_path && Storage::disk('local')->exists($ebook->file_path)) {
                    Storage::disk('local')->delete($ebook->file_path);
                }
                $updateData['file_path'] = $request->file('file')->store('ebooks/' . $user->id, 'local');

                // If ebook was approved, set back to pending for re-review
                if ($ebook->status === 'approved') {
                    $updateData['status'] = 'pending';
                }
            }

            $ebook->update($updateData);

            // Clear ebook caches
            Cache::forget("ebooks.show.{$ebook->id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');
            Cache::forget('home.carousel.ebooks');
            Cache::forget('home.hot.ebooks');
            Cache::forget('home.featured.ebooks');
            Cache::forget('home.free.ebooks');

            return response()->json([
                'message' => 'Cập nhật thành công',
                'ebook' => $ebook->fresh(['author:id,name', 'category:id,name']),
            ]);
        }, 'Không thể cập nhật ebook');
    }

    /**
     * Get author earnings
     */
    public function earnings(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isAuthor()) {
                return response()->json([
                    'error' => 'Bạn cần là tác giả để xem doanh thu',
                ], 403);
            }

            return response()->json(
                Cache::remember("author.{$user->id}.earnings", 300, function() use ($user) {
                    return [
                        'balance' => $user->earnings_balance,
                        'total_earned' => $user->total_earned,
                        'min_withdrawal' => config('library.min_withdrawal_amount', 100000),
                        'can_withdraw' => $user->earnings_balance >= config('library.min_withdrawal_amount', 100000),
                    ];
                })
            );
        }, 'Không thể lấy doanh thu');
    }

    /**
     * Get detailed earnings from each purchase
     */
    public function earningsHistory(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user->isAuthor()) {
                return response()->json([
                    'error' => 'Bạn cần là tác giả để xem doanh thu',
                ], 403);
            }

            $authorPercent = config('library.ebook_author_revenue_percent', 60);

            // Get purchases for author's ebooks
            $limit = $request->input('limit', 1000);
            $purchases = EbookPurchase::whereHas('ebook', function ($query) use ($user) {
                    $query->where('author_id', $user->id);
                })
                ->with(['ebook:id,title,price', 'user:id,name'])
                ->orderBy('purchase_date', 'desc')
                ->paginate($limit);

            $data = $purchases->getCollection()->map(function ($purchase) use ($authorPercent) {
                $totalAmount = (float) $purchase->amount;
                $authorEarnings = ($totalAmount * $authorPercent) / 100;
                $platformFee = $totalAmount - $authorEarnings;

                return [
                    'id' => $purchase->id,
                    'ebook_title' => $purchase->ebook->title,
                    'buyer_name' => $purchase->user->name,
                    'purchase_date' => $purchase->purchase_date->format('Y-m-d H:i'),
                    'total_amount' => $totalAmount,
                    'platform_fee' => round($platformFee, 2),
                    'author_earnings' => round($authorEarnings, 2),
                    'author_percent' => $authorPercent,
                ];
            });

            return response()->json([
                'author_percent' => $authorPercent,
                'total_earned' => $user->total_earned,
                'balance' => $user->earnings_balance,
                'data' => $data,
                'pagination' => [
                    'current_page' => $purchases->currentPage(),
                    'last_page' => $purchases->lastPage(),
                    'per_page' => $purchases->perPage(),
                    'total' => $purchases->total(),
                ],
            ]);
        }, 'Không thể lấy lịch sử doanh thu');
    }

    /**
     * Request withdrawal
     */
    public function withdraw(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
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

            // Check balance with row lock to prevent race condition
            $user = User::lockForUpdate()->find($user->id);

            if ($user->earnings_balance < $amount) {
                return response()->json([
                    'error' => 'Số dư không đủ',
                ], 422);
            }

            // Check withdrawal threshold
            // All withdrawals require admin approval - always set to pending
            $requiresApproval = true;

            DB::beginTransaction();
            try {
                // Create withdrawal request first
                $withdrawal = WithdrawalRequest::create([
                    'author_id' => $user->id,
                    'amount' => $amount,
                    'bank_account_info' => [
                        'bank_account' => $request->bank_account,
                        'bank_name' => $request->bank_name,
                        'account_holder' => $request->account_holder,
                    ],
                    'status' => 'pending',
                ]);

                // Deduct from earnings_balance only after withdrawal request created
                $user->subtractEarnings($amount);

                // Clear author earnings cache
                Cache::forget("author.{$user->id}.earnings");
                // Clear admin withdrawal requests cache
                Cache::forget('admin.withdrawal_requests');

                // Log action
                AuditLog::log(
                    $user->id,
                    'WITHDRAWAL_REQUEST',
                    'withdrawal_requests',
                    $withdrawal->id,
                    null,
                    ['amount' => $amount, 'status' => 'pending']
                );

                // Create notification for author
                Notification::create([
                    'user_id' => $user->id,
                    'title' => 'Yêu cầu rút tiền',
                    'content' => "Yêu cầu rút " . number_format($amount) . " VNĐ đang chờ admin duyệt.",
                    'type' => Notification::TYPE_WEB,
                ]);

                // Notify admin about new withdrawal request
                $admin = \App\Models\User::where('role', 'admin')->first();
                if ($admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'title' => 'Yêu cầu rút tiền mới',
                        'content' => "Tác giả {$user->name} yêu cầu rút " . number_format($amount) . " VNĐ.",
                        'type' => Notification::TYPE_WEB,
                    ]);
                }

                DB::commit();

                return response()->json([
                    'message' => 'Yêu cầu rút tiền đã được gửi, chờ admin duyệt',
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $amount,
                    'status' => $withdrawal->status,
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Withdrawal request failed', [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        }, 'Không thể tạo yêu cầu rút tiền');
    }

    /**
     * Get withdrawal history for author
     */
    public function withdrawalHistory(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $user = JWTAuth::parseToken()->authenticate();

            $query = WithdrawalRequest::where('author_id', $user->id);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $limit = $request->input('limit', 1000);
            $requests = $query->orderBy('created_at', 'desc')->paginate($limit);

            return response()->json($requests);
        }, 'Không thể lấy lịch sử rút tiền');
    }

    /**
     * Soft delete ebook
     */
    public function destroy(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $user = JWTAuth::parseToken()->authenticate();

            $ebook = Ebook::where('id', $id)
                ->where('author_id', $user->id)
                ->first();

            if (!$ebook) {
                return response()->json([
                    'error' => 'Ebook không tồn tại hoặc bạn không có quyền xóa',
                ], 404);
            }

            // Soft delete ebook
            $ebook->delete();

            // Clear ebook caches
            Cache::forget("ebooks.show.{$ebook->id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');
            Cache::forget('home.carousel.ebooks');
            Cache::forget('home.hot.ebooks');
            Cache::forget('home.featured.ebooks');
            Cache::forget('home.free.ebooks');
            // Clear admin pending ebooks cache
            Cache::forget('admin.pending_ebooks');

            // Notify admin
            $admin = User::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Tác giả xóa ebook',
                    'content' => "Tác giả {$user->name} đã xóa ebook '{$ebook->title}' (ID: {$ebook->id}).",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            // Log action
            AuditLog::log(
                $user->id,
                'DELETE_EBOOK',
                'ebooks',
                $ebook->id,
                ['title' => $ebook->title, 'status' => $ebook->status],
                ['deleted' => true]
            );

            return response()->json([
                'message' => 'Ebook đã được xóa thành công',
            ]);
        }, 'Không thể xóa ebook');
    }
}
