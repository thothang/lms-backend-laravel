<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SepayGateway
{
    protected $apiKey;
    protected $secretKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.sepay.api_key');
        $this->secretKey = config('services.sepay.secret_key');
        $this->baseUrl = config('services.sepay.base_url', 'https://sandbox.sepay.com/api/v1');
    }

    /**
     * Create a payment request
     */
    public function createPayment(float $amount, string $orderId, string $callbackUrl): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment', [
                'amount' => (int) $amount,
                'currency' => 'VND',
                'order_id' => $orderId,
                'callback_url' => $callbackUrl,
                'return_url' => config('app.url') . '/payment-result',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'payment_url' => $data['payment_url'],
                    'transaction_id' => $data['transaction_id'],
                ];
            }

            Log::error('Sepay API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => 'API request failed',
            ];
        } catch (\Exception $e) {
            Log::error('Sepay connection error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifySignature(array $payload): bool
    {
        if (!isset($payload['signature'])) {
            return false;
        }

        $signature = $payload['signature'];
        unset($payload['signature']);

        // Calculate expected signature
        $expected = md5(json_encode($payload) . $this->secretKey);

        return hash_equals($expected, $signature);
    }

    /**
     * Check transaction status
     */
    public function checkTransactionStatus(string $transactionId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($this->baseUrl . '/payment/' . $transactionId);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => 'API request failed',
            ];
        } catch (\Exception $e) {
            Log::error('Sepay check status error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
