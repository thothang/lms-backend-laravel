<?php

namespace App\Services;

use App\Models\PaymentTransaction;
use SePay\SePayClient;
use SePay\Builders\CheckoutBuilder;
use Illuminate\Support\Facades\Log;

class SepayService
{
    protected string $merchantId;
    protected string $secretKey;
    protected string $env;
    protected $client;

    public function __construct()
    {
        $this->merchantId = config('services.sepay.merchant_id', env('SEPAY_MERCHANT_ID'));
        $this->secretKey = config('services.sepay.secret_key', env('SEPAY_SECRET_KEY'));
        $this->env = config('services.sepay.env', env('SEPAY_ENV', 'sandbox'));
        
        $this->client = new SePayClient($this->merchantId, $this->secretKey, $this->env);
        
        // Enable debug mode for troubleshooting
        $this->client->enableDebugMode();
    }

    /**
     * Create checkout URL for payment - redirects to SePay checkout page
     * Note: custom_data is stored in database instead of URL (not in signature)
     */
    public function createCheckoutUrl(array $params): string
    {
        try {
            // Use public callback URL if available (for ngrok/production)
            $frontendUrl = env('PUBLIC_CALLBACK_URL') 
                ? env('PUBLIC_CALLBACK_URL') 
                : config('app.frontend_url', 'http://localhost:5173');

            $checkoutData = CheckoutBuilder::make()
                ->currency('VND')
                ->orderInvoiceNumber($params['order_invoice_number'])
                ->orderAmount((int) $params['amount'])
                ->operation('PURCHASE')
                ->orderDescription($params['order_description'] ?? 'Payment')
                ->successUrl($frontendUrl . '/payment/success')
                ->errorUrl($frontendUrl . '/payment/error')
                ->cancelUrl($frontendUrl . '/payment/cancel')
                ->build();

            // Generate form fields with signature
            $formFields = $this->client->checkout()->generateFormFields($checkoutData);
            $checkoutUrl = $this->client->checkout()->getCheckoutUrl($this->env);

            // Store custom_data in database for later retrieval (since it's not in signature)
            if (!empty($params['custom_data'])) {
                $this->storePendingTransaction($params['order_invoice_number'], $params['custom_data'], $params['amount']);
            }
            
            Log::info('SePay checkout created', [
                'url' => $checkoutUrl,
                'form_fields' => $formFields,
                'frontend_url' => $frontendUrl
            ]);
            
            // Return checkout URL with query params (GET method)
            return $checkoutUrl . '?' . http_build_query($formFields);
            
        } catch (\Exception $e) {
            Log::error('SePay checkout error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Store pending transaction with custom_data for later retrieval
     */
    protected function storePendingTransaction(string $orderInvoiceNumber, array $customData, int $amount): void
    {
        $type = $customData['type'] ?? 'unknown';
        $userId = $customData['user_id'] ?? null;
        $borrowRecordId = $customData['borrow_record_id'] ?? null;

        // Create pending transaction record
        PaymentTransaction::create([
            'user_id' => $userId,
            'borrow_record_id' => $borrowRecordId,
            'order_invoice_number' => $orderInvoiceNumber,
            'type' => $type,
            'amount' => $amount,
            'currency' => 'VND',
            'transaction_status' => 'PENDING',
            'metadata' => $customData,
        ]);
    }

    /**
     * Get pending transaction by order invoice number
     */
    public function getPendingTransaction(string $orderInvoiceNumber): ?PaymentTransaction
    {
        return PaymentTransaction::where('order_invoice_number', $orderInvoiceNumber)
            ->where('transaction_status', 'PENDING')
            ->first();
    }

    /**
     * Get checkout form data for frontend POST form
     */
    public function createCheckoutData(array $params): array
    {
        try {
            // Use public callback URL if available (for ngrok/production)
            $frontendUrl = env('PUBLIC_CALLBACK_URL') 
                ? env('PUBLIC_CALLBACK_URL') 
                : config('app.frontend_url', 'http://localhost:5173');

            $checkoutData = CheckoutBuilder::make()
                ->currency('VND')
                ->orderInvoiceNumber($params['order_invoice_number'])
                ->orderAmount((int) $params['amount'])
                ->operation('PURCHASE')
                ->orderDescription($params['order_description'] ?? 'Payment')
                ->successUrl($frontendUrl . '/payment/success')
                ->errorUrl($frontendUrl . '/payment/error')
                ->cancelUrl($frontendUrl . '/payment/cancel')
                ->build();

            // Generate form fields with signature
            $formFields = $this->client->checkout()->generateFormFields($checkoutData);
            $checkoutUrl = $this->client->checkout()->getCheckoutUrl($this->env);

            // Store custom_data in database for later retrieval
            if (!empty($params['custom_data'])) {
                $this->storePendingTransaction($params['order_invoice_number'], $params['custom_data'], $params['amount']);
            }

            Log::info('SePay checkout data created', [
                'checkout_url' => $checkoutUrl,
                'form_fields_keys' => array_keys($formFields),
                'frontend_url' => $frontendUrl
            ]);

            return [
                'checkout_url' => $checkoutUrl,
                'form_fields' => $formFields,
            ];
            
        } catch (\Exception $e) {
            Log::error('SePay checkout data error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
