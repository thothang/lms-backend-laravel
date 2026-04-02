<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\Review;
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
     * Get list of ebooks
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ebook::with('author:id,name')
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

        // Sort
        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        $query->orderBy($sort, $order);

        // Pagination
        $perPage = $request->limit ?? 20;
        $ebooks = $query->paginate($perPage);

        // Add metadata
        $ebooks->getCollection()->transform(function ($ebook) {
            $ebook->average_rating = $ebook->average_rating;
            $ebook->purchase_count = $ebook->purchase_count;
            return $ebook;
        });

        return response()->json($ebooks);
    }

    /**
     * Get ebook details
     */
    public function show(int $id): JsonResponse
    {
        $ebook = Ebook::with([
            'author:id,name',
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

        $user = JWTAuth::parseToken()->authenticate();
        $ebook->is_purchased = $ebook->isPurchasedBy($user);
        $ebook->is_author = ($ebook->author_id === $user->id);
        $ebook->average_rating = $ebook->average_rating;
        $ebook->total_reviews = $ebook->reviews->count();
        $ebook->purchase_count = $ebook->purchase_count;

        return response()->json($ebook);
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

        // Add author earnings (60%)
        $ebook->author->addEarnings($ebook->getAuthorEarnings());

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
     * Read an ebook (stream with watermark)
     */
    public function read(int $id): JsonResponse
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

        // Get file path
        $filePath = $ebook->file_path;

        if (!Storage::disk('private')->exists($filePath)) {
            return response()->json([
                'error' => 'File không tồn tại',
            ], 404);
        }

        // Stream with watermark
        return $this->watermarkService->streamWithWatermark($ebook, $user);
    }
}
