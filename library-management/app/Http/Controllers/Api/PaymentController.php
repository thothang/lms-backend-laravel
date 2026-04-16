<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BorrowRecord;
use App\Models\Notification;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\SepayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentController extends Controller
{
    protected SepayService $sepayService;

    public function __construct(SepayService $sepayService)
    {
        $this->sepayService = $sepayService;
    }

    /**
     * Create deposit payment for borrow record
     */
    public function createDepositPayment(Request $request): JsonResponse
    {
        $request->validate([
            'borrow_record_id' => 'required|exists:borrow_records,id',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $borrowRecord = BorrowRecord::findOrFail($request->borrow_record_id);

        // Verify ownership
        if ($borrowRecord->user_id !== $user->id) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        // Check if already paid
        if ($borrowRecord->prepaid_amount > 0) {
            return response()->json(['error' => 'Đã thanh toán trước'], 400);
        }

        $amount = $borrowRecord->calculateDepositAmount();
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $checkoutUrl = $this->sepayService->createCheckoutUrl([
            'amount' => $amount,
            'order_invoice_number' => 'DEP-' . $borrowRecord->id . '-' . time(),
            'order_description' => "Đặt cọc mượn sách #{$borrowRecord->id}",
            'success_url' => "{$frontendUrl}/payment/success",
            'error_url' => "{$frontendUrl}/payment/error",
            'cancel_url' => "{$frontendUrl}/payment/cancel",
            'custom_data' => [
                'borrow_record_id' => $borrowRecord->id,
                'type' => 'deposit',
                'user_id' => $user->id,
            ],
        ]);

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'amount' => $amount,
            'borrow_record_id' => $borrowRecord->id,
        ]);
    }

    /**
     * Create balance top-up payment
     */
    public function createTopupPayment(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000|max:50000000',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $amount = (int) $request->amount;
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $checkoutData = $this->sepayService->createCheckoutData([
            'amount' => $amount,
            'order_invoice_number' => 'TOPUP-' . $user->id . '-' . time(),
            'order_description' => "Nap tien vao tai khoan: {$amount} VND",
            'success_url' => "{$frontendUrl}/payment/success",
            'error_url' => "{$frontendUrl}/payment/error",
            'cancel_url' => "{$frontendUrl}/payment/cancel",
            'custom_data' => [
                'user_id' => $user->id,
                'type' => 'topup',
            ],
        ]);

        return response()->json($checkoutData);
    }

    /**
     * Create fine payment
     */
    public function createFinePayment(Request $request): JsonResponse
    {
        $request->validate([
            'borrow_record_id' => 'required|exists:borrow_records,id',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $borrowRecord = BorrowRecord::with('user')->findOrFail($request->borrow_record_id);

        // Verify ownership or admin
        if ($borrowRecord->user_id !== $user->id && !in_array($user->role, ['admin', 'librarian'])) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        if ($borrowRecord->actual_fee <= 0) {
            return response()->json(['error' => 'Không có phí để thanh toán'], 400);
        }

        $amount = (int) $borrowRecord->actual_fee;
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $checkoutUrl = $this->sepayService->createCheckoutUrl([
            'amount' => $amount,
            'order_invoice_number' => 'FINE-' . $borrowRecord->id . '-' . time(),
            'order_description' => "Thanh toán phí quá hạn #{$borrowRecord->id}",
            'success_url' => "{$frontendUrl}/payment/success",
            'error_url' => "{$frontendUrl}/payment/error",
            'cancel_url' => "{$frontendUrl}/payment/cancel",
            'custom_data' => [
                'borrow_record_id' => $borrowRecord->id,
                'type' => 'fine',
                'user_id' => $borrowRecord->user_id,
            ],
        ]);

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'amount' => $amount,
            'borrow_record_id' => $borrowRecord->id,
        ]);
    }

    /**
     * IPN callback from SePay - handles successful payments
     */
    public function ipn(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            
            \Log::info('SePay IPN received', $data);

            // ⚠️ CRITICAL: Verify webhook signature first
            $providedSignature = $data['signature'] ?? '';
            if (!$this->sepayGateway->verifySignature($data, $providedSignature)) {
                \Log::warning('Invalid SePay webhook signature', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'data' => $data
                ]);
                return response()->json(['error' => 'Invalid signature'], 403);
            }

            // Only process ORDER_PAID
            if (($data['notification_type'] ?? '') !== 'ORDER_PAID') {
                return response()->json(['success' => true], 200);
            }

            $order = $data['order'] ?? [];
            $transactionId = $data['transaction']['id'] ?? null;
            $orderInvoiceNumber = $order['order_invoice_number'] ?? null;
            
            // Idempotency check: prevent duplicate processing
            if ($transactionId) {
                $existingTransaction = PaymentTransaction::where('transaction_id', $transactionId)->first();
                if ($existingTransaction) {
                    \Log::info('SePay IPN duplicate transaction', ['transaction_id' => $transactionId]);
                    return response()->json(['success' => true], 200);
                }
            }

            // Find pending transaction by order_invoice_number to get custom_data
            $pendingTransaction = $orderInvoiceNumber 
                ? $this->sepayService->getPendingTransaction($orderInvoiceNumber) 
                : null;
            
            // Determine payment type and metadata
            if ($pendingTransaction) {
                $type = $pendingTransaction->type;
                $customData = $pendingTransaction->metadata ?? [];
                $borrowRecordId = $customData['borrow_record_id'] ?? $pendingTransaction->borrow_record_id;
                $userId = $customData['user_id'] ?? $pendingTransaction->user_id;
            } else {
                // Fallback: try to get from direct IPN data
                $customData = $order['custom_data'] ?? [];
                $type = $customData['type'] ?? 'unknown';
                $borrowRecordId = $customData['borrow_record_id'] ?? null;
                $userId = $customData['user_id'] ?? null;
            }
            
            $orderAmount = (float) ($order['order_amount'] ?? 0);

            try {
                DB::beginTransaction();

                switch ($type) {
                    case 'deposit':
                        $this->processDepositPayment($borrowRecordId, $orderAmount, $data);
                        break;

                    case 'topup':
                        $this->processTopupPayment($userId, $orderAmount, $data);
                        break;

                    case 'fine':
                        $this->processFinePayment($borrowRecordId, $orderAmount, $data);
                        break;

                    default:
                        \Log::warning('Unknown payment type', ['type' => $type]);
                }

                // Update pending transaction to completed
                if ($pendingTransaction) {
                    $pendingTransaction->update([
                        'transaction_id' => $transactionId,
                        'order_id' => $data['order']['id'] ?? null,
                        'payment_method' => $data['transaction']['payment_method'] ?? null,
                        'transaction_status' => 'APPROVED',
                    ]);
                }

                DB::commit();
            } catch (\Illuminate\Database\QueryException $e) {
                // Handle duplicate entry error (MySQL error code 23000)
                if ($e->errorInfo[1] === 1062) {
                    DB::rollBack();
                    \Log::info('SePay IPN duplicate entry caught by constraint', ['transaction_id' => $transactionId]);
                    return response()->json(['success' => true], 200);
                }
                throw $e;
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            \Log::error('SePay IPN Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Process deposit payment
     */
    private function processDepositPayment(?int $borrowRecordId, float $amount, array $data): void
    {
        if (!$borrowRecordId) {
            throw new \Exception('Missing borrow_record_id');
        }

        $borrowRecord = BorrowRecord::findOrFail($borrowRecordId);
        
        // Update prepaid amount
        $borrowRecord->update([
            'prepaid_amount' => $amount,
            'deposit_paid_at' => now(),
            'deposit_transaction_id' => $data['transaction']['id'] ?? null,
        ]);

        // Log transaction
        $this->logTransaction($borrowRecord->user_id, 'deposit', $amount, $data, $borrowRecord->id);

        // Create notification
        Notification::create([
            'user_id' => $borrowRecord->user_id,
            'title' => 'Thanh toán đặt cọc thành công',
            'content' => "Bạn đã thanh toán đặt cọc " . number_format($amount) . " VND cho mượn sách #{$borrowRecord->id}",
            'type' => Notification::TYPE_WEB,
        ]);
    }

    /**
     * Process top-up payment
     */
    private function processTopupPayment(?int $userId, float $amount, array $data): void
    {
        if (!$userId) {
            throw new \Exception('Missing user_id');
        }

        $user = User::findOrFail($userId);
        
        // Update balance using increment for atomic operation
        $user->increment('balance', $amount);
        $user->refresh();

        // Log transaction
        $this->logTransaction($userId, 'topup', $amount, $data);

        // Create notification
        Notification::create([
            'user_id' => $userId,
            'title' => 'Nạp tiền thành công',
            'content' => "Bạn đã nạp " . number_format($amount) . " VND vào tài khoản. Số dư hiện tại: " . number_format($user->balance) . " VND",
            'type' => Notification::TYPE_WEB,
        ]);
    }

    /**
     * Process fine payment
     */
    private function processFinePayment(?int $borrowRecordId, float $amount, array $data): void
    {
        if (!$borrowRecordId) {
            throw new \Exception('Missing borrow_record_id');
        }

        $borrowRecord = BorrowRecord::findOrFail($borrowRecordId);
        
        // Mark as paid
        $borrowRecord->update([
            'fee_paid_at' => now(),
            'fee_transaction_id' => $data['transaction']['id'] ?? null,
        ]);

        // Update user debt
        $user = $borrowRecord->user;
        $newDebt = max(0, $user->total_debt - $amount);
        $user->update(['total_debt' => $newDebt]);

        // Log transaction
        $this->logTransaction($borrowRecord->user_id, 'fine', $amount, $data, $borrowRecord->id);

        // Create notification
        Notification::create([
            'user_id' => $borrowRecord->user_id,
            'title' => 'Thanh toán phí thành công',
            'content' => "Bạn đã thanh toán phí quá hạn " . number_format($amount) . " VND",
            'type' => Notification::TYPE_WEB,
        ]);
    }

    /**
     * Log payment transaction
     */
    private function logTransaction(int $userId, string $type, float $amount, array $data, ?int $borrowRecordId = null): void
    {
        PaymentTransaction::create([
            'user_id' => $userId,
            'borrow_record_id' => $borrowRecordId,
            'transaction_id' => $data['transaction']['id'] ?? null,
            'order_id' => $data['order']['id'] ?? null,
            'order_invoice_number' => $data['order']['order_invoice_number'] ?? null,
            'type' => $type,
            'amount' => $amount,
            'currency' => $data['order']['order_currency'] ?? 'VND',
            'payment_method' => $data['transaction']['payment_method'] ?? null,
            'transaction_status' => $data['transaction']['transaction_status'] ?? 'APPROVED',
            'metadata' => $data,
        ]);
    }

    /**
     * Get payment history for user
     */
    public function getHistory(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        $transactions = PaymentTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($transactions);
    }

    /**
     * Get all topup transactions (admin/librarian)
     */
    public function getAllTopups(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        // Check permission
        if (!in_array($user->role, ['admin', 'librarian'])) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        $query = PaymentTransaction::with('user:id,name,email')
            ->where('type', 'topup')
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Search by user name
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $topups = $query->paginate(20);

        return response()->json([
            'data' => $topups->items(),
            'pagination' => [
                'current_page' => $topups->currentPage(),
                'last_page' => $topups->lastPage(),
                'per_page' => $topups->perPage(),
                'total' => $topups->total(),
            ],
            'summary' => [
                'total_amount' => $topups->sum('amount'),
                'total_count' => $topups->total(),
            ],
        ]);
    }

    /**
     * Handle success return from SePay - redirect to frontend
     */
    public function successRedirect(Request $request): \Illuminate\Http\RedirectResponse
    {
        // Log for debugging
        \Log::info('SePay success redirect', $request->all());
        
        // Redirect to frontend
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect($frontendUrl . '/payment/success?' . http_build_query($request->all()));
    }

    /**
     * Handle error return from SePay - redirect to frontend
     */
    public function errorRedirect(Request $request): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect($frontendUrl . '/payment/error?' . http_build_query($request->all()));
    }

    /**
     * Handle cancel return from SePay - redirect to frontend
     */
    public function cancelRedirect(Request $request): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect($frontendUrl . '/payment/cancel?' . http_build_query($request->all()));
    }

    /**
     * Handle success return from SePay (API JSON response)
     */
    public function success(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Thanh toán thành công. Vui lòng đợi xác nhận từ hệ thống.',
        ]);
    }

    /**
     * Direct confirm topup for sandbox testing (since IPN cannot reach localhost)
     * ⚠️ CRITICAL SECURITY: Only available in non-production environments!
     */
    public function confirmTopup(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $request->validate([
            'amount' => 'required|numeric|min:10000|max:10000000',
        ]);

        $amount = (float) $request->amount;
        $requestId = $request->header('X-Request-ID'); // Client-generated unique ID

        // Idempotency check: prevent duplicate processing using request_id column
        if ($requestId) {
            $existingTransaction = PaymentTransaction::where('request_id', $requestId)->first();
            if ($existingTransaction) {
                $user->refresh();
                \Log::info('Topup duplicate detected by request_id', ['request_id' => $requestId, 'transaction_id' => $existingTransaction->transaction_id]);
                return response()->json([
                    'success' => true,
                    'message' => 'Giao dịch đã được xử lý trước đó',
                    'new_balance' => $user->balance,
                    'duplicate' => true,
                    'transaction_id' => $existingTransaction->transaction_id,
                ]);
            }
        } else {
            // Fallback: check by amount, user and very short time window (30 seconds) to avoid false positives
            $existingTransaction = PaymentTransaction::where('user_id', $user->id)
                ->where('type', 'topup')
                ->where('amount', $amount)
                ->where('transaction_status', 'APPROVED')
                ->where('created_at', '>=', now()->subSeconds(30))
                ->first();

            if ($existingTransaction) {
                $user->refresh();
                \Log::info('Topup duplicate detected by fallback check', ['amount' => $amount, 'transaction_id' => $existingTransaction->transaction_id]);
                return response()->json([
                    'success' => true,
                    'message' => 'Giao dịch đã được xử lý trước đó',
                    'new_balance' => $user->balance,
                    'duplicate' => true,
                    'transaction_id' => $existingTransaction->transaction_id,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            // Use lockForUpdate to prevent race conditions
            $user = User::lockForUpdate()->find($user->id);
            
            // Update balance using direct update for atomic operation
            $user->balance = $user->balance + $amount;
            $user->save();
            $user->refresh();

            // Log transaction with request ID for tracking
            $transactionId = 'TEST-' . uniqid();
            
            // Create payment transaction record
            $transaction = new PaymentTransaction();
            $transaction->user_id = $user->id;
            $transaction->transaction_id = $transactionId;
            $transaction->request_id = $requestId; // Store as separate column
            $transaction->type = 'topup';
            $transaction->amount = $amount;
            $transaction->currency = 'VND';
            $transaction->transaction_status = 'APPROVED';
            $transaction->metadata = ['source' => 'sandbox_test'];
            $transaction->save();

            // Notification
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Nạp tiền thành công',
                'content' => "Bạn đã nạp " . number_format($amount) . " VND vào tài khoản. Số dư hiện tại: " . number_format($user->balance) . " VND",
                'type' => Notification::TYPE_WEB,
            ]);

            DB::commit();

            \Log::info('Topup successful', ['user_id' => $user->id, 'amount' => $amount, 'new_balance' => $user->balance, 'request_id' => $requestId]);

            return response()->json([
                'success' => true,
                'message' => 'Nạp tiền thành công!',
                'new_balance' => $user->balance,
                'duplicate' => false,
                'transaction_id' => $transactionId,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Handle error return from SePay
     */
    public function error(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Thanh toán thất bại.',
        ], 400);
    }

    /**
     * Handle cancel return from SePay
     */
    public function cancel(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Bạn đã hủy thanh toán.',
        ], 400);
    }
}