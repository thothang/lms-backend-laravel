<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Ebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Traits\HandlesApiExceptions;

class DisplayManagerController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get all active display items (hot, featured, carousel)
     */
    public function index(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            $books = Book::where(function($q) {
                    $q->where('is_hot', true)
                      ->orWhere('is_featured', true)
                      ->orWhere('in_carousel', true);
                })
                ->get()
                ->map(function ($item) {
                    $item->itemType = 'book';
                    return $item;
                });

            $ebooks = Ebook::where(function($q) {
                    $q->where('is_hot', true)
                      ->orWhere('is_featured', true)
                      ->orWhere('in_carousel', true);
                })
                ->with('author:id,name')
                ->get()
                ->map(function ($item) {
                    $item->itemType = 'ebook';
                    return $item;
                });

            return response()->json([
                'books' => $books,
                'ebooks' => $ebooks,
            ]);
        }, 'Không thể lấy danh sách hiển thị');
    }

    /**
     * Toggle display settings (hot, featured, carousel) for an item
     */
    public function toggle(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'id' => 'required|integer',
                'type' => 'required|in:book,ebook',
                'setting' => 'required|in:is_hot,is_featured,in_carousel',
                'value' => 'required|boolean',
            ]);

            $model = $request->type === 'book' ? Book::class : Ebook::class;
            $item = $model::findOrFail($request->id);
            $setting = $request->setting;
            $value = $request->value;

            // Handle Carousel Order auto-calculation
            if ($setting === 'in_carousel') {
                if ($value && !$item->in_carousel) {
                    // Add to carousel
                    $maxOrder = $model::where('in_carousel', true)->max('carousel_order') ?? 0;
                    $item->carousel_order = $maxOrder + 1;
                } elseif (!$value && $item->in_carousel) {
                    // Remove from carousel
                    $item->carousel_order = 0;
                }
            }

            $item->{$setting} = $value;
            $item->save();

            // Reorder remaining if removed from carousel
            if ($setting === 'in_carousel' && !$value) {
                $this->reorderCarousel($model);
            }

            $this->clearDisplayCaches();

            return response()->json([
                'message' => 'Cập nhật thành công',
                'item' => $item,
            ]);
        }, 'Không thể cập nhật trạng thái hiển thị');
    }

    /**
     * Reorder carousel items
     */
    public function reorder(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|integer',
                'items.*.type' => 'required|in:book,ebook',
                'items.*.carousel_order' => 'required|integer',
            ]);

            DB::beginTransaction();
            try {
                foreach ($request->items as $itemData) {
                    $model = $itemData['type'] === 'book' ? Book::class : Ebook::class;
                    $model::where('id', $itemData['id'])
                          ->update(['carousel_order' => $itemData['carousel_order']]);
                }
                DB::commit();

                $this->clearDisplayCaches();

                return response()->json([
                    'message' => 'Cập nhật thứ tự thành công',
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        }, 'Không thể cập nhật thứ tự');
    }

    private function reorderCarousel($modelClass)
    {
        $items = $modelClass::where('in_carousel', true)
                            ->orderBy('carousel_order')
                            ->get();

        $order = 1;
        foreach ($items as $item) {
            if ($item->carousel_order !== $order) {
                $item->update(['carousel_order' => $order]);
            }
            $order++;
        }
    }

    private function clearDisplayCaches()
    {
        Cache::forget('books.carousel');
        Cache::forget('books.hot');
        Cache::forget('books.featured');
        Cache::forget('home.carousel.books');
        Cache::forget('home.hot.books');
        Cache::forget('home.featured.books');

        Cache::forget('ebooks.carousel');
        Cache::forget('ebooks.hot');
        Cache::forget('ebooks.featured');
        Cache::forget('home.carousel.ebooks');
        Cache::forget('home.hot.ebooks');
        Cache::forget('home.featured.ebooks');
        Cache::forget('home.free.ebooks');
    }
}
