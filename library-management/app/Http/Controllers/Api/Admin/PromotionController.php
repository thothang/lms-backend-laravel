<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $promotions]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min:0',
            'target_type' => 'required|in:all_ebooks,category,specific_ebooks',
            'target_ids' => 'nullable|array',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $promotion = Promotion::create($validated);
        Cache::forget('active_promotions');

        return response()->json([
            'message' => 'Tạo chương trình khuyến mãi thành công',
            'data' => $promotion
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $promotion = Promotion::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'discount_type' => 'sometimes|required|in:percent,fixed',
            'discount_value' => 'sometimes|required|numeric|min:0',
            'target_type' => 'sometimes|required|in:all_ebooks,category,specific_ebooks',
            'target_ids' => 'nullable|array',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        $promotion->update($validated);
        Cache::forget('active_promotions');

        return response()->json([
            'message' => 'Cập nhật chương trình khuyến mãi thành công',
            'data' => $promotion
        ]);
    }

    public function destroy($id)
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->delete();
        Cache::forget('active_promotions');

        return response()->json([
            'message' => 'Xóa chương trình khuyến mãi thành công'
        ]);
    }
}
