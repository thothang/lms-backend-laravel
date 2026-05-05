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
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class EbookController extends Controller
{
    use HandlesApiExceptions;

    protected $watermarkService;

    public function __construct(EbookWatermarkService $watermarkService)
    {
        $this->watermarkService = $watermarkService;
    }

    /**
     * Get list of ebooks (public - approved only)
     */
    public function index(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
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
        }, 'Không thể lấy danh sách ebook');
    }

    /**
     * Get carousel ebooks (public - approved only)
     */
    public function carousel(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $ebooks = Cache::remember('ebooks.carousel', 3600, function() {
                return Ebook::with(['author:id,name', 'category:id,name'])
                    ->approved()
                    ->where('in_carousel', true)
                    ->orderBy('carousel_order')
                    ->limit(10)
                    ->get();
            });

            return response()->json($ebooks);
        }, 'Không thể lấy danh sách ebook carousel');
    }

    /**
     * Get hot ebooks (public - approved only)
     */
    public function hot(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $ebooks = Cache::remember('ebooks.hot', 1800, function() {
                return Ebook::with(['author:id,name', 'category:id,name'])
                    ->approved()
                    ->where('is_hot', true)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get();
            });

            return response()->json($ebooks);
        }, 'Không thể lấy danh sách ebook hot');
    }

    /**
     * Get featured ebooks (public - approved only)
     */
    public function featured(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $ebooks = Cache::remember('ebooks.featured', 1800, function() {
                return Ebook::with(['author:id,name', 'category:id,name'])
                    ->approved()
                    ->where('is_featured', true)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get();
            });

            return response()->json($ebooks);
        }, 'Không thể lấy danh sách ebook nổi bật');
    }

    /**
     * Get all ebooks (admin/librarian - includes softdeleted)
     * Default: show only approved (active) ebooks
     */
    public function getAll(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
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
        }, 'Không thể lấy danh sách ebook');
    }

    /**
     * Get ebook details (public - metadata only, purchase info for authenticated users)
     */
    public function show(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $ebook = Cache::remember("ebooks.show.{$id}", 900, function() use ($id) {
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
                    return null;
                }

                $ebook->total_reviews = $ebook->reviews->count();
                return $ebook;
            });

            if (!$ebook) {
                return response()->json([
                    'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
                ], 404);
            }

            // Only check purchase status if user is authenticated (not cached)
            try {
                $user = JWTAuth::parseToken()->authenticate();
                if ($user) {
                    $ebook->is_purchased = $ebook->isPurchasedBy($user);
                    $ebook->is_author = ($ebook->author_id === $user->id);
                }
            } catch (\Exception $e) {
                // User not authenticated - skip purchase check
            }

            return response()->json($ebook);
        }, 'Không thể lấy thông tin ebook');
    }

    /**
     * Update ebook (admin/librarian only)
     */
    public function update(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
            $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'author_name' => 'nullable|string|max:255',
                'category_id' => 'sometimes|required|exists:book_categories,id',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric|min:0',
                'is_free' => 'sometimes|boolean',
                'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
                'file' => 'nullable|file|mimes:pdf|max:51200',
                'free_preview_pages' => 'nullable|integer|min:0',
            ]);

            $ebook = Ebook::find($id);

            if (!$ebook) {
                return response()->json(['error' => 'Ebook không tồn tại'], 404);
            }

            $user = JWTAuth::parseToken()->authenticate();
            $oldData = $ebook->only(['title', 'author_name', 'category_id', 'description', 'price', 'is_free', 'free_preview_pages']);

            // Update fields
            $updateData = $request->only(['title', 'author_name', 'category_id', 'description', 'price', 'free_preview_pages']);

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
                $authorId = $ebook->author_id;
                $updateData['file_path'] = $request->file('file')->store('ebooks/' . $authorId, 'local');
            }

            $ebook->update($updateData);

            // Clear cache for this ebook and related lists
            Cache::forget("ebooks.show.{$id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');

            // Log action
            AuditLog::log(
                $user->id,
                'UPDATE_EBOOK',
                'ebooks',
                $ebook->id,
                $oldData,
                $updateData
            );

            // Notify author if ebook was updated by someone else
            if ($ebook->author_id && $ebook->author_id !== $user->id) {
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
        }, 'Không thể cập nhật ebook');
    }

    /**
     * Soft delete ebook (admin/librarian only)
     */
    public function destroy(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $ebook = Ebook::find($id);

            if (!$ebook) {
                return response()->json(['error' => 'Ebook không tồn tại'], 404);
            }

            $user = JWTAuth::parseToken()->authenticate();

            // Clear cache before delete
            Cache::forget("ebooks.show.{$id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');

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
        }, 'Không thể xóa ebook');
    }

    /**
     * Restore soft deleted ebook (admin only)
     */
    public function restore(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
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
        }, 'Không thể khôi phục ebook');
    }

    /**
     * Permanently delete ebook (admin only)
     */
    public function forceDelete(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
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
        }, 'Không thể xóa vĩnh viễn ebook');
    }

    /**
     * Get trashed ebooks (admin only)
     */
    public function trashed(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $ebooks = Ebook::onlyTrashed()
                ->with(['author:id,name', 'category:id,name'])
                ->orderBy('deleted_at', 'desc')
                ->paginate(20);

            return response()->json($ebooks);
        }, 'Không thể lấy danh sách ebook đã xóa');
    }

    /**
     * Get user's purchased ebooks
     */
    public function myEbooks(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $user = JWTAuth::parseToken()->authenticate();

            $purchases = Cache::remember("user.{$user->id}.my_ebooks", 300, function() use ($user) {
                return EbookPurchase::with('ebook.author:id,name')
                    ->where('user_id', $user->id)
                    ->orderBy('purchase_date', 'desc')
                    ->get()
                    ->map(function ($purchase) {
                        return [
                            'id' => $purchase->ebook->id,
                            'title' => $purchase->ebook->title,
                            'author' => $purchase->ebook->author->name,
                            'author_name' => $purchase->ebook->author_name,
                            'uploaded_by_admin' => $purchase->ebook->uploaded_by_admin,
                            'cover_image' => $purchase->ebook->cover_image,
                            'price' => $purchase->amount,
                            'purchase_date' => $purchase->purchase_date,
                            'is_free' => $purchase->ebook->is_free,
                        ];
                    });
            });

            return response()->json([
                'data' => $purchases,
            ]);
        }, 'Không thể lấy danh sách ebook đã mua');
    }

    /**
     * Purchase an ebook
     */
    public function purchase(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $user = JWTAuth::parseToken()->authenticate();
            $ebook = Ebook::approved()->find($id);

            if (!$ebook) {
                return response()->json([
                    'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
                ], 404);
            }

            // Check if ebook is free - no need to purchase
            if ($ebook->is_free) {
                return response()->json([
                    'error' => 'Ebook miễn phí, bạn có thể đọc ngay mà không cần mua',
                ], 422);
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

            // Notify user about successful purchase
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Mua ebook thành công',
                'content' => "Bạn đã mua thành công ebook '{$ebook->title}'. Bạn có thể đọc ngay bây giờ.",
                'type' => Notification::TYPE_WEB,
            ]);

            // Clear cache for this ebook to update is_purchased status
            Cache::forget("ebooks.show.{$ebook->id}");
            // Clear cache for user's my_ebooks list
            Cache::forget("user.{$user->id}.my_ebooks");
            // Clear home page cache (contains carousel, hot, featured ebooks)
            Cache::forget('home.carousel.ebooks');
            Cache::forget('home.hot.ebooks');
            Cache::forget('home.featured.ebooks');
            Cache::forget('home.free.ebooks');
            // Clear ebook list cache
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');
            // Clear admin revenue cache
            Cache::forget('admin.revenue');
            // Clear admin transactions cache
            Cache::forget('admin.transactions');
            // Clear author earnings cache
            if ($ebook->author_id) {
                Cache::forget("author.{$ebook->author_id}.earnings");
            }
            // Clear report overview cache
            Cache::forget('reports.overview');

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
        }, 'Không thể mua ebook');
    }

    /**
     * Check ebook access (trả về thông tin quyền đọc)
     */
    public function access(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
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
                'preview_pages' => $ebook->free_preview_pages ?? 0,
                'message' => $canRead ? 'Bạn có quyền đọc ebook này' : 'Bạn cần mua ebook này trước',
            ]);
        }, 'Không thể kiểm tra quyền truy cập ebook');
    }

    /**
     * Read an ebook (stream with watermark)
     */
    public function read(int $id)
    {
        return $this->withApiExceptionHandling(function () use ($id) {
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
        }, 'Không thể đọc ebook');
    }

    /**
     * Preview ebook (free preview pages without watermark)
     */
    public function preview(int $id)
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $user = JWTAuth::parseToken()->authenticate();
            $ebook = Ebook::approved()->find($id);

            if (!$ebook) {
                return response()->json([
                    'error' => 'Ebook không tồn tại hoặc chưa được duyệt',
                ], 404);
            }

            // Check if ebook has free preview pages
            if (!$ebook->free_preview_pages || $ebook->free_preview_pages <= 0) {
                return response()->json([
                    'error' => 'Ebook này không có bản xem trước miễn phí',
                ], 403);
            }

            // Stream preview pages without watermark
            return $this->watermarkService->streamPreview($ebook);
        }, 'Không thể xem trước ebook');
    }

    /**
     * Set ebook as hot/featured/carousel (admin/librarian only)
     */
    public function setHotBooks(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
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

                // Clear cache for carousel, hot, featured lists
                Cache::forget('ebooks.carousel');
                Cache::forget('ebooks.hot');
                Cache::forget('ebooks.featured');

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

            // Clear cache for carousel, hot, featured lists
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');

            return response()->json([
                'message' => 'Cập nhật thành công',
                'ebook' => $ebook,
            ]);
        }, 'Không thể cập nhật trạng thái ebook');
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
