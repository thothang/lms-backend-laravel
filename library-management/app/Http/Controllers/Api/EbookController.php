<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\EbookWatermarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Storage;

class EbookController extends Controller
{
    protected $watermarkService;

    public function __construct(EbookWatermarkService $watermarkService)
    {
        $this->watermarkService = $watermarkService;
    }

    /**
     * Get list of ebooks (public - approved only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ebook::with(['author:id,name', 'category:id,name'])
            ->approved();

        // Filter by keyword
        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                  ->orWhereHas('author', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
            });
        }

        // Filter by price
        if ($request->has('is_free')) {
            $query->where('is_free', $request->boolean('is_free'));
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Sort
        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        $query->orderBy($sort, $order);

        // Pagination
        $perPage = $request->limit ?? 20;
        $ebooks = $query->paginate($perPage);

        $ebooks->getCollection()->transform(function ($ebook) {
            return $ebook;
        });

        return response()->json($ebooks);
    }

    /**
     * Get carousel ebooks (public - approved only)
     */
    public function carousel(): JsonResponse
    {
        $ebooks = Ebook::with(['author:id,name', 'category:id,name'])
            ->approved()
            ->where('in_carousel', true)
            ->orderBy('carousel_order')
            ->limit(10)
            ->get();

        return response()->json($ebooks);
    }

    /**
     * Get hot ebooks (public - approved only)
     */
    public function hot(): JsonResponse
    {
        $ebooks = Ebook::with(['author:id,name', 'category:id,name'])
            ->approved()
            ->where('is_hot', true)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($ebooks);
    }

    /**
     * Get featured ebooks (public - approved only)
     */
    public function featured(): JsonResponse
    {
        $ebooks = Ebook::with(['author:id,name', 'category:id,name'])
            ->approved()
            ->where('is_featured', true)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($ebooks);
    }

    /**
     * Get all ebooks (admin/librarian - includes softdeleted)
     * Default: show only approved (active) ebooks
     */
    public function getAll(Request $request): JsonResponse
    {
        $query = Ebook::with(['author:id,name', 'category:id,name']);

        // Filter by status: active, pending, rejected, or trashed
        // Default: show only approved (active) ebooks
        if ($request->has('status')) {
            if ($request->status === 'trashed') {
                $query->onlyTrashed();
            } elseif ($request->status === 'all') {
                // Show all ebooks including all statuses
            } else {
                $query->where('status', $request->status);
            }
        } else {
            // Default: show only approved (active) ebooks
            $query->where('status', 'approved');
        }

        // Filter by keyword
        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                  ->orWhere('author_name', 'like', "%{$keyword}%");
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Sort
        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        $query->orderBy($sort, $order);

        // Pagination
        $perPage = $request->limit ?? 20;
        $ebooks = $query->paginate($perPage);

        return response()->json($ebooks);
    }

    /**
     * Get ebook details (public - metadata only, purchase info for authenticated users)
     */
    public function show(int $id): JsonResponse
    {
        $ebook = Ebook::with([
            'author:id,name',
            'category:id,name',
            'reviews' => function ($query) {
                $query->with('user:id,name')
                    ->orderBy('created_at', 'desc')
                    ->limit(10);
            },
        ])->approved()->find($id);

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
            ], 404);
        }

        // Only check purchase status if user is authenticated
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if ($user) {
                $ebook->is_purchased = $ebook->isPurchasedBy($user);
                $ebook->is_author = ($ebook->author_id === $user->id);
            }
        } catch (\Exception $e) {
            // User not authenticated - skip purchase check
        }
        
        $ebook->total_reviews = $ebook->reviews->count();

        return response()->json($ebook);
    }

    /**
     * Update ebook (admin/librarian only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:book_categories,id',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'is_free' => 'sometimes|required|in:0,1',
            'cover_image' => 'nullable|image|max:5120',
            'free_preview_pages' => 'nullable|integer|min:0',
        ]);

        $ebook = Ebook::find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();
        $oldData = $ebook->only(['title', 'category_id', 'description', 'price', 'is_free', 'free_preview_pages']);

        // Update fields
        $updateData = $request->only(['title', 'category_id', 'description', 'price', 'free_preview_pages']);
        
        if ($request->has('is_free')) {
            $updateData['is_free'] = $request->is_free == '1';
        }

        // Handle cover image
        if ($request->hasFile('cover_image')) {
            // Delete old cover
            if ($ebook->cover_image) {
                Storage::disk('public')->delete($ebook->cover_image);
            }
            $updateData['cover_image'] = $request->file('cover_image')->store('covers/ebooks', 'public');
        }

        $ebook->update($updateData);

        // Log action
        AuditLog::log(
            $user->id,
            'UPDATE_EBOOK',
            'ebooks',
            $ebook->id,
            $oldData,
            $updateData
        );

        // Notify author if ebook was updated
        if ($ebook->author_id !== $user->id) {
            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Ebook của bạn đã được cập nhật',
                'content' => "Ebook '{$ebook->title}' đã được quản trị viên cập nhật thông tin.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Cập nhật ebook thành công',
            'ebook' => $ebook->fresh(['author:id,name', 'category:id,name']),
        ]);
    }

    /**
     * Soft delete ebook (admin/librarian only)
     */
    public function destroy(int $id): JsonResponse
    {
        $ebook = Ebook::find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Log before delete
        AuditLog::log(
            $user->id,
            'DELETE_EBOOK',
            'ebooks',
            $ebook->id,
            ['title' => $ebook->title, 'status' => $ebook->status],
            null
        );

        $ebook->delete(); // Soft delete

        // Notify author if ebook was deleted by another user
        if ($ebook->author_id !== $user->id) {
            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Ebook của bạn đã bị xóa tạm thời',
                'content' => "Ebook '{$ebook->title}' đã bị quản trị viên xóa tạm thời (di chuyển vào thùng rác).",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Xóa ebook thành công (di chuyển vào thùng rác)',
        ]);
    }

    /**
     * Restore soft deleted ebook (admin only)
     */
    public function restore(int $id): JsonResponse
    {
        $ebook = Ebook::onlyTrashed()->find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại trong thùng rác'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();
        $ebook->restore();

        // Log action
        AuditLog::log(
            $user->id,
            'RESTORE_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['title' => $ebook->title]
        );

        // Notify author if ebook was restored by another user
        if ($ebook->author_id !== $user->id) {
            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Ebook của bạn đã được khôi phục',
                'content' => "Ebook '{$ebook->title}' đã được quản trị viên khôi phục.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Khôi phục ebook thành công',
        ]);
    }

    /**
     * Permanently delete ebook (admin only)
     */
    public function forceDelete(int $id): JsonResponse
    {
        $ebook = Ebook::onlyTrashed()->find($id);

        if (!$ebook) {
            return response()->json(['error' => 'Ebook không tồn tại trong thùng rác'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Log before permanently delete
        AuditLog::log(
            $user->id,
            'FORCE_DELETE_EBOOK',
            'ebooks',
            $ebook->id,
            ['title' => $ebook->title],
            null
        );

        // Delete files
        if ($ebook->file_path && Storage::disk('local')->exists($ebook->file_path)) {
            Storage::disk('local')->delete($ebook->file_path);
        }
        if ($ebook->cover_image && Storage::disk('public')->exists($ebook->cover_image)) {
            Storage::disk('public')->delete($ebook->cover_image);
        }

        // Notify author before deletion
        $authorId = $ebook->author_id;
        $ebookTitle = $ebook->title;

        $ebook->forceDelete();

        if ($authorId !== $user->id) {
            Notification::create([
                'user_id' => $authorId,
                'title' => 'Ebook của bạn đã bị xóa vĩnh viễn',
                'content' => "Ebook '{$ebookTitle}' đã bị quản trị viên xóa vĩnh viễn.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Xóa vĩnh viễn ebook thành công',
        ]);
    }

    /**
     * Get trashed ebooks (admin only)
     */
    public function trashed(): JsonResponse
    {
        $ebooks = Ebook::onlyTrashed()
            ->with(['author:id,name', 'category:id,name'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(20);

        return response()->json($ebooks);
    }

    /**
     * Get user's purchased ebooks
     */
    public function myEbooks(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $purchases = EbookPurchase::with('ebook.author:id,name')
            ->where('user_id', $user->id)
            ->orderBy('purchase_date', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->ebook->id,
                    'title' => $purchase->ebook->title,
                    'author' => $purchase->ebook->author->name,
                    'price' => $purchase->amount,
                    'purchase_date' => $purchase->purchase_date,
                    'is_free' => $purchase->ebook->is_free,
                ];
            });

        return response()->json([
            'data' => $purchases,
        ]);
    }

    /**
     * Purchase an ebook
     */
    public function purchase(Request $request, int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::approved()->find($id);

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
            ], 404);
        }

        // Check if already purchased
        if ($ebook->isPurchasedBy($user)) {
            return response()->json([
                'error' => 'Bạn đã mua ebook này rồi',
            ], 422);
        }

        // Check if user is the author
        if ($ebook->author_id === $user->id) {
            return response()->json([
                'error' => 'Bạn không thể mua ebook của chính mình',
            ], 422);
        }

        // Check balance for non-free ebooks
        if (!$ebook->is_free) {
            if ($user->balance < $ebook->price) {
                return response()->json([
                    'error' => 'Số dư không đủ',
                ], 422);
            }

            // Deduct from balance
            $user->subtractBalance($ebook->price);
        }

        // Create purchase record
        $purchase = EbookPurchase::create([
            'user_id' => $user->id,
            'ebook_id' => $ebook->id,
            'purchase_date' => now(),
            'amount' => $ebook->is_free ? 0 : $ebook->price,
        ]);

        // Create transaction record
        $transaction = \App\Models\Transaction::create([
            'user_id' => $user->id,
            'amount' => $ebook->is_free ? 0 : $ebook->price,
            'type' => 'ebook_purchase',
            'status' => 'success',
            'payment_gateway' => 'balance',
            'metadata' => [
                'ebook_id' => $ebook->id,
                'ebook_title' => $ebook->title,
                'author_id' => $ebook->author_id,
                'author_name' => $ebook->author_name,
                'uploaded_by_admin' => $ebook->uploaded_by_admin,
                'price' => $ebook->price,
            ],
        ]);

        // Revenue distribution logic:
        // - If uploaded_by_admin = true (admin/thủ thư uploaded) -> 100% revenue goes to admin
        // - If uploaded_by_admin = false (author uploaded) -> author gets 60%, admin gets 40%
        $admin = User::where('role', 'admin')->first();
        
        if ($ebook->uploaded_by_admin) {
            // Admin/librarian uploaded ebook: 100% goes to admin
            // Author info is stored in author_name field (not a user account)
            if ($admin) {
                $admin->addEarnings($ebook->price); // Full price goes to admin (adds to both earnings_balance and total_earned)
                
                // Notify admin
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Có người mua ebook của thư viện',
                    'content' => "Ebook '{$ebook->title}' (Tác giả: {$ebook->author_name}) đã được mua bởi {$user->name}. Doanh thu " . number_format($ebook->price) . " VNĐ đã được cộng vào tài khoản thư viện.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }
        } else {
            // Author uploaded ebook: author gets 60%, admin gets 40%
            $author = $ebook->author;
            $authorEarnings = $ebook->getAuthorEarnings();
            $libraryFee = $ebook->price - $authorEarnings; // 40%
            
            $author->addEarnings($authorEarnings); // Adds to both earnings_balance and total_earned
            
            if ($admin) {
                $admin->addEarnings($libraryFee); // Adds to both earnings_balance and total_earned
            }
            
            // Notify author
            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Có người mua ebook của bạn',
                'content' => "Ebook '{$ebook->title}' đã được mua bởi {$user->name}. Bạn nhận được " . number_format($authorEarnings) . " VNĐ.",
                'type' => Notification::TYPE_WEB,
            ]);
        }

        return response()->json([
            'message' => 'Mua ebook thành công',
            'purchase' => [
                'id' => $purchase->id,
                'ebook_id' => $ebook->id,
                'title' => $ebook->title,
                'amount' => $purchase->amount,
                'purchase_date' => $purchase->purchase_date,
            ],
        ]);
    }

    /**
     * Check ebook access (trả về thông tin quyền đọc)
     */
    public function access(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::approved()->find($id);

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
                'can_read' => false,
            ], 404);
        }

        $canRead = $ebook->canBeReadBy($user);
        $isPurchased = EbookPurchase::where('user_id', $user->id)
            ->where('ebook_id', $ebook->id)
            ->exists();

        return response()->json([
            'ebook_id' => $ebook->id,
            'title' => $ebook->title,
            'can_read' => $canRead,
            'is_purchased' => $isPurchased,
            'is_author' => $ebook->author_id === $user->id,
            'is_free' => $ebook->is_free,
            'preview_pages' => $ebook->free_preview_pages ?? 5,
            'message' => $canRead ? 'Bạn có quyền đọc ebook này' : 'Bạn cần mua ebook này trước',
        ]);
    }

    /**
     * Read an ebook (stream with watermark)
     */
    public function read(int $id)
    {
        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::approved()->find($id);

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
            ], 404);
        }

        // Check if user can read
        if (!$ebook->canBeReadBy($user)) {
            return response()->json([
                'error' => 'Bạn cần mua ebook này trước',
            ], 403);
        }

        // Stream with watermark (sử dụng filippo-toso/pdf-watermarker)
        return $this->watermarkService->streamWithWatermark($ebook, $user);
    }

    /**
     * Preview an ebook (stream preview pages without watermark)
     */
    public function preview(int $id)
    {
        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::approved()->find($id);

        if (!$ebook) {
            return response()->json([
                'error' => 'Ebook không tồn tại hoặc chưa được duy���t',
            ], 404);
        }

        // Preview available for everyone (no purchase required)
        // Trả về một số trang đầu tiên không watermark
        return $this->watermarkService->streamPreview($ebook);
    }

    /**
     * Set ebook as hot/featured/carousel (admin/librarian only)
     */
    public function setHotBooks(Request $request): JsonResponse
    {
        $request->validate([
            'ebook_id' => 'required|exists:ebooks,id',
            'is_hot' => 'boolean',
            'is_featured' => 'boolean',
            'in_carousel' => 'boolean',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $ebook = Ebook::find($request->ebook_id);
        $wasInCarousel = $ebook->in_carousel;
        $nowInCarousel = $request->input('in_carousel', false);
        
        // Auto-calculate carousel_order
        if ($nowInCarousel && !$wasInCarousel) {
            // Thêm mới vào carousel: lấy max + 1
            $maxOrder = Ebook::where('in_carousel', true)->max('carousel_order') ?? 0;
            $carouselOrder = $maxOrder + 1;
        } elseif (!$nowInCarousel && $wasInCarousel) {
            // Bỏ khỏi carousel: reorder lại các item còn lại
            $ebook->update(['carousel_order' => 0]);
            $this->reorderEbookCarousel();
            $ebook->refresh();
            
            // Log action
            AuditLog::log(
                $user->id,
                'SET_EBOOK_HOT',
                'ebooks',
                $ebook->id,
                null,
                [
                    'is_hot' => $request->input('is_hot', false),
                    'is_featured' => $request->input('is_featured', false),
                    'in_carousel' => false,
                    'action' => 'removed_from_carousel',
                ]
            );

            // Notify author
            if ($ebook->author_id !== $user->id) {
                Notification::create([
                    'user_id' => $ebook->author_id,
                    'title' => 'Ebook được gỡ khỏi carousel',
                    'content' => "Ebook '{$ebook->title}' đã được gỡ khỏi danh sách carousel.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }
            
            $ebook->update([
                'is_hot' => $request->input('is_hot', false),
                'is_featured' => $request->input('is_featured', false),
                'in_carousel' => false,
            ]);

            return response()->json([
                'message' => 'Đã gỡ ebook khỏi carousel',
                'ebook' => $ebook,
            ]);
        } elseif ($nowInCarousel) {
            // Đã có trong carousel, giữ nguyên order
            $carouselOrder = $ebook->carousel_order ?: 1;
        } else {
            $carouselOrder = 0;
        }

        $ebook->update([
            'is_hot' => $request->input('is_hot', false),
            'is_featured' => $request->input('is_featured', false),
            'in_carousel' => $nowInCarousel,
            'carousel_order' => $carouselOrder,
        ]);

        // Log action
        AuditLog::log(
            $user->id,
            'SET_EBOOK_HOT',
            'ebooks',
            $ebook->id,
            null,
            [
                'is_hot' => $ebook->is_hot,
                'is_featured' => $ebook->is_featured,
                'in_carousel' => $ebook->in_carousel,
                'carousel_order' => $ebook->carousel_order,
            ]
        );

        // Notify author about status change
        if ($ebook->author_id !== $user->id) {
            $changes = [];
            if ($ebook->is_hot) $changes[] = 'nổi bật (hot)';
            if ($ebook->is_featured) $changes[] = 'đề xuất (featured)';
            if ($ebook->in_carousel) $changes[] = 'carousel';

            if (!empty($changes)) {
                Notification::create([
                    'user_id' => $ebook->author_id,
                    'title' => 'Ebook của bạn được đánh dấu đặc biệt',
                    'content' => "Ebook '{$ebook->title}' đã được thêm vào danh sách: " . implode(', ', $changes) . ".",
                    'type' => Notification::TYPE_WEB,
                ]);
            }
        }

        return response()->json([
            'message' => 'Cập nhật thành công',
            'ebook' => $ebook,
        ]);
    }

    /**
     * Reorder carousel after removing an item
     */
    private function reorderEbookCarousel(): void
    {
        $carouselEbooks = Ebook::where('in_carousel', true)
            ->orderBy('carousel_order')
            ->get();

        $order = 1;
        foreach ($carouselEbooks as $ebook) {
            $ebook->update(['carousel_order' => $order]);
            $order++;
        }
    }
}
