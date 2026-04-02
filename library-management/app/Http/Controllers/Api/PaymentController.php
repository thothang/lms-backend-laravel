<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Create a deposit request
     */
    public function deposit(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000|max:100000000',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $amount = $request->amount;

        $result = $this->paymentService->createDeposit($user, $amount);

        if (!$result['success']) {
            return response()->json([
                'error' => $result['message'],
            ], 422);
        }

        return response()->json([
            'transaction_id' => $result['transaction_id'],
            'payment_url' => $result['payment_url'],
            'message' => 'Chuyển hướng đến Sepay để thanh toán',
        ]);
    }

    /**
     * Handle Sepay callback
     */
    public function sepayCallback(Request $request): JsonResponse
    {
        $result = $this->paymentService->handleSepayCallback($request);

        if (!$result['success']) {
            return response()->json(['error' => $result['message']], 400);
        }

        return response()->json(['status' => 'ok']);
    }
}
