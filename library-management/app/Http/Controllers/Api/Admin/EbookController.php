<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Services\EbookService;
use App\Events\EbookStatusChanged;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Cache;

class EbookController extends Controller
{
    use HandlesApiExceptions;

    protected $ebookService;

    public function __construct(EbookService $ebookService)
    {
        $this->ebookService = $ebookService;
    }

    /**
     * Get pending ebooks
     */
    public function pendingEbooks(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $cacheKey = 'admin.pending_ebooks';
            $cacheTtl = 300;

            $ebooks = Cache::remember($cacheKey, $cacheTtl, function() {
                return Ebook::query()
                    ->select(['id', 'title', 'author_name', 'author_id', 'price', 'is_free', 'status', 'created_at'])
                    ->with(['author:id,name,email'])
                    ->pending()
                    ->orderBy('created_at', 'desc')
                    ->get();
            });

            $result = $ebooks->map(function ($ebook) {
                return [
                    'id' => $ebook->id,
                    'title' => $ebook->title,
                    'author' => $ebook->author,
                    'price' => $ebook->price,
                    'is_free' => $ebook->is_free,
                    'created_at' => $ebook->created_at,
                ];
            });

            return response()->json($result);
        }, 'Không thể lấy danh sách ebook chờ duyệt');
    }

    /**
     * Approve ebook
     */
    public function approveEbook(int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($id) {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role === 'librarian' && !$user->hasPermission('can_approve_ebook')) {
                return response()->json(['error' => 'Bạn không có quyền duyệt ebook'], 403);
            }

            $ebook = Ebook::find($id);

            if (!$ebook) {
                return response()->json(['error' => 'Ebook không tồn tại'], 404);
            }

            if ($ebook->status !== 'pending') {
                return response()->json([
                    'error' => 'Ebook không ở trạng thái chờ duyệt',
                    'current_status' => $ebook->status,
                    'message' => "Ebook hiện ở trạng thái: {$ebook->status}"
                ], 422);
            }

            $this->ebookService->approveEbook($ebook);

            // Clear caches
            Cache::forget("ebooks.show.{$ebook->id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');
            Cache::forget('home.carousel.ebooks');
            Cache::forget('home.hot.ebooks');
            Cache::forget('home.featured.ebooks');
            Cache::forget('home.free.ebooks');
            Cache::forget('admin.pending_ebooks');
            Cache::forget('reports.overview');

            AuditLog::log(
                $user->id,
                'APPROVE_EBOOK',
                'ebooks',
                $ebook->id,
                ['status' => 'pending'],
                ['status' => 'approved']
            );

            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Ebook đã được duyệt',
                'content' => "Ebook '{$ebook->title}' đã được duyệt và sẵn sàng để bán.",
                'type' => Notification::TYPE_WEB,
            ]);

            return response()->json([
                'message' => 'Duyệt ebook thành công',
            ]);
        }, 'Không thể duyệt ebook');
    }

    /**
     * Reject ebook
     */
    public function rejectEbook(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
            $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $user = JWTAuth::parseToken()->authenticate();

            if ($user->role === 'librarian' && !$user->hasPermission('can_approve_ebook')) {
                return response()->json(['error' => 'Bạn không có quyền duyệt ebook'], 403);
            }

            $ebook = Ebook::find($id);

            if (!$ebook) {
                return response()->json(['error' => 'Ebook không tồn tại'], 404);
            }

            if ($ebook->status !== 'pending') {
                return response()->json(['error' => 'Ebook không ở trạng thái chờ duyệt'], 422);
            }

            $ebook->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
            ]);

            Cache::forget("ebooks.show.{$ebook->id}");
            Cache::forget('ebooks.carousel');
            Cache::forget('ebooks.hot');
            Cache::forget('ebooks.featured');
            Cache::forget('home.carousel.ebooks');
            Cache::forget('home.hot.ebooks');
            Cache::forget('home.featured.ebooks');
            Cache::forget('home.free.ebooks');
            Cache::forget('admin.pending_ebooks');

            Notification::create([
                'user_id' => $ebook->author_id,
                'title' => 'Ebook bị từ chối',
                'content' => "Ebook '{$ebook->title}' đã bị từ chối. Lý do: {$request->reason}",
                'type' => Notification::TYPE_WEB,
            ]);

            broadcast(new EbookStatusChanged($ebook, 'rejected', $request->reason));

            AuditLog::log(
                $user->id,
                'REJECT_EBOOK',
                'ebooks',
                $ebook->id,
                ['status' => 'pending'],
                ['status' => 'rejected', 'reason' => $request->reason]
            );

            return response()->json([
                'message' => 'Từ chối ebook thành công',
            ]);
        }, 'Không thể từ chối ebook');
    }

    /**
     * Upload ebook by admin
     */
    public function uploadEbook(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'title' => 'required|string|max:255',
                'category_id' => 'required|exists:book_categories,id',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'is_free' => 'required|in:0,1',
                'file' => 'required|file|mimes:pdf|max:51200',
                'cover_image' => 'nullable|image|max:5120',
                'free_preview_pages' => 'nullable|integer|min:0',
                'author_name' => 'required|string|max:255',
            ]);

            $admin = JWTAuth::parseToken()->authenticate();
            $data = $request->except(['file', 'cover_image']);
            $data['is_free'] = $request->is_free == '1';

            $file = $request->file('file');
            $path = $file->store('ebooks/admin_' . $admin->id, 'local');

            $coverImagePath = null;
            if ($request->hasFile('cover_image')) {
                $coverImagePath = $request->file('cover_image')->store('covers/ebooks', 'public');
            }

            $ebook = Ebook::create([
                'title' => $data['title'],
                'author_id' => $admin->id,
                'author_name' => $request->author_name,
                'category_id' => $data['category_id'],
                'description' => $data['description'] ?? null,
                'cover_image' => $coverImagePath,
                'price' => $data['price'],
                'file_path' => $path,
                'free_preview_pages' => $data['free_preview_pages'] ?? 0,
                'is_free' => $data['is_free'],
                'status' => 'approved',
                'uploaded_by_admin' => true,
            ]);

            AuditLog::log(
                $admin->id,
                'ADMIN_UPLOAD_EBOOK',
                'ebooks',
                $ebook->id,
                null,
                ['title' => $ebook->title, 'author_name' => $request->author_name]
            );

            return response()->json([
                'message' => 'Ebook đã được tải lên và xuất bản thành công',
                'ebook_id' => $ebook->id,
            ], 201);
        }, 'Không thể tải lên ebook');
    }
}
