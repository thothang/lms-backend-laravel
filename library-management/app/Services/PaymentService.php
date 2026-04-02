<?php

namespace App\Services;

use App\Models\User;
use App\Models\Transaction;
use App\Models\BorrowRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PaymentService
{
    protected $sepayGateway;

    public function __construct(SepayGateway $sepayGateway)
    {
        $this->sepayGateway = $sepayGateway;
    }

    /**
     * Create a deposit request
     */
    public function createDeposit(User $user, float $amount): array
    {
        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'type' => 'deposit',
            'status' => 'pending',
            'payment_gateway' => 'Sepay',
            'metadata' => [
                'order_type' => 'deposit',
            ],
        ]);

        try {
            // Call Sepay API
            $result = $this->sepayGateway->createPayment(
                $amount,
                'LMS_' . $transaction->id,
                route('api.sepay.callback')
            );

            if (!$result['success']) {
                $transaction->update(['status' => 'failed']);
                return [
                    'success' => false,
                    'message' => 'Không thể tạo thanh toán: ' . ($result['error'] ?? 'Unknown error'),
                ];
            }

            // Update transaction with gateway transaction ID
            $transaction->update([
                'gateway_transaction_id' => $result['transaction_id'],
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'payment_url' => $result['payment_url'],
                ]),
            ]);

            return [
                'success' => true,
                'transaction_id' => $transaction->id,
                'payment_url' => $result['payment_url'],
            ];
        } catch (\Exception $e) {
            Log::error('Sepay deposit error: ' . $e->getMessage());
            $transaction->update(['status' => 'failed']);

            return [
                'success' => false,
                'message' => 'Lỗi kết nối với cổng thanh toán',
            ];
        }
    }

    /**
     * Handle Sepay callback
     */
    public function handleSepayCallback(Request $request): array
    {
        // Verify signature
        if (!$this->sepayGateway->verifySignature($request->all())) {
            Log::warning('Invalid Sepay signature', $request->all());
            return [
                'success' => false,
                'message' => 'Invalid signature',
            ];
        }

        $gatewayTransactionId = $request->input('transaction_id');
        $status = $request->input('status');
        $amount = $request->input('amount');

        // Find transaction
        $transaction = Transaction::where('gateway_transaction_id', $gatewayTransactionId)->first();

        if (!$transaction) {
            return [
                'success' => false,
                'message' => 'Transaction not found',
            ];
        }

        // Idempotency check - already processed
        if ($transaction->status === 'success') {
            return [
                'success' => true,
                'message' => 'Already processed',
            ];
        }

        // Process based on status
        if ($status === 'success') {
            return $this->processSuccessfulPayment($transaction, $amount);
        } else {
            $transaction->update(['status' => 'failed']);
            return [
                'success' => true,
                'message' => 'Payment failed',
            ];
        }
    }

    /**
     * Process successful payment
     */
    protected function processSuccessfulPayment(Transaction $transaction, float $amount): array
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($transaction, $amount) {
            // Lock the transaction row
            $transaction = Transaction::lockForUpdate()->find($transaction->id);

            // Double-check status
            if ($transaction->status === 'success') {
                return [
                    'success' => true,
                    'message' => 'Already processed',
                ];
            }

            // Mark transaction as success
            $transaction->markSuccess();

            // Get user
            $user = $transaction->user;

            // Handle based on transaction type
            switch ($transaction->type) {
                case 'deposit':
                    // Balance already added by markSuccess()
                    Log::info("Deposit successful", [
                        'user_id' => $user->id,
                        'amount' => $amount,
                    ]);
                    break;

                case 'borrow_fee':
                    // Complete the pending return
                    if (isset($transaction->metadata['borrow_id'])) {
                        $borrowRecord = BorrowRecord::find($transaction->metadata['borrow_id']);
                        if ($borrowRecord) {
                            app(BorrowService::class)->finalizePendingReturn($borrowRecord);
                        }
                    }
                    break;
            }

            return [
                'success' => true,
                'message' => 'Payment processed successfully',
            ];
        });
    }
}
