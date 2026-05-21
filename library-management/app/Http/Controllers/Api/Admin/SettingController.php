<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AuditLog;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get settings
     */
    public function settings(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            return response()->json(
                Cache::remember('admin.settings', 1800, function() {
                    return [
                        'default_daily_fee' => Setting::get('default_daily_fee'),
                        'deposit_percent' => Setting::get('deposit_percent'),
                        'max_deposit_amount' => Setting::get('max_deposit_amount'),
                        'max_borrow_per_user' => Setting::get('max_borrow_per_user'),
                        'max_renew_count' => Setting::get('max_renew_count'),
                        'overdue_penalty_multiplier' => Setting::get('overdue_penalty_multiplier'),
                        'reservation_fee_percent' => Setting::get('reservation_fee_percent'),
                        'ebook_author_revenue_percent' => Setting::get('ebook_author_revenue_percent'),
                        'min_withdrawal_amount' => Setting::get('min_withdrawal_amount'),
                        'author_withdrawal_threshold_percent' => Setting::get('author_withdrawal_threshold_percent'),
                    ];
                })
            );
        }, 'Không thể lấy cấu hình');
    }

    /**
     * Update settings
     */
    public function updateSettings(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $request->validate([
                'default_daily_fee' => 'sometimes|numeric|min:0',
                'deposit_percent' => 'sometimes|numeric|min:0|max:100',
                'max_deposit_amount' => 'sometimes|numeric|min:0',
                'max_borrow_per_user' => 'sometimes|integer|min:1',
                'max_renew_count' => 'sometimes|integer|min:0',
                'overdue_penalty_multiplier' => 'sometimes|numeric|min:0',
                'reservation_fee_percent' => 'sometimes|numeric|min:0|max:100',
                'ebook_author_revenue_percent' => 'sometimes|numeric|min:0|max:100',
                'min_withdrawal_amount' => 'sometimes|numeric|min:0',
                'author_withdrawal_threshold_percent' => 'sometimes|numeric|min:0|max:100',
            ]);

            foreach ($request->all() as $key => $value) {
                Setting::set($key, $value);
            }

            Cache::forget('admin.settings');

            AuditLog::log(
                auth()->id(),
                'UPDATE_SETTINGS',
                'settings',
                0,
                null,
                $request->all()
            );

            return response()->json([
                'message' => 'Cập nhật cấu hình thành công',
            ]);
        }, 'Không thể cập nhật cấu hình');
    }
}
