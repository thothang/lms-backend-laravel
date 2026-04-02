<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        return response()->json($settings);
    }

    /**
     * Update a setting
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);

        Setting::set($request->key, $request->value);

        return response()->json([
            'message' => 'Cập nhật thành công',
        ]);
    }
}
