<?php

namespace App\Services;

use App\Models\User;
use App\Models\Book;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OCRCccdService
{
    protected $provider;

    public function __construct()
    {
        $this->provider = config('library.ocr_provider', 'fpt');
    }

    /**
     * Recognize CCCD from image
     */
    public function recognize(string $imageBase64): ?array
    {
        switch ($this->provider) {
            case 'fpt':
                return $this->recognizeWithFpt($imageBase64);
            case 'google':
                return $this->recognizeWithGoogle($imageBase64);
            default:
                return null;
        }
    }

    /**
     * Recognize with FPT.AI
     */
    protected function recognizeWithFpt(string $imageBase64): ?array
    {
        $apiKey = config('library.fpt_api_key');

        if (!$apiKey) {
            Log::warning('FPT API key not configured');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
            ])->post('https://api.fpt.ai/vision/idr/vnm', [
                'image' => $imageBase64,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['data']) && isset($data['data']['info'])) {
                    $info = $data['data']['info'];
                    return [
                        'name' => $info['name'] ?? null,
                        'cccd_number' => $info['id'] ?? null,
                        'dob' => $info['dob'] ?? null,
                        'gender' => $info['sex'] ?? null,
                        'nationality' => $info['nationality'] ?? null,
                        'address' => $info['address'] ?? null,
                        'province' => $info['province'] ?? null,
                        'district' => $info['district'] ?? null,
                        'ward' => $info['ward'] ?? null,
                    ];
                }
            }

            Log::error('FPT OCR error', ['response' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('FPT OCR exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Recognize with Google Cloud Vision
     */
    protected function recognizeWithGoogle(string $imageBase64): ?array
    {
        $apiKey = config('library.google_vision_key');

        if (!$apiKey) {
            Log::warning('Google Vision API key not configured');
            return null;
        }

        try {
            $response = Http::post(
                "https://vision.googleapis.com/v1/images:annotate?key={$apiKey}",
                [
                    'requests' => [
                        [
                            'image' => ['content' => $imageBase64],
                            'features' => [
                                ['type' => 'DOCUMENT_TEXT_DETECTION'],
                            ],
                        ],
                    ],
                ]
            );

            if ($response->successful()) {
                $data = $response->json();
                // Parse Google Vision response for CCCD fields
                // This is a simplified version - actual implementation would need
                // more sophisticated text parsing
                return $this->parseGoogleVisionResponse($data);
            }

            Log::error('Google Vision error', ['response' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Google Vision exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse Google Vision response
     */
    protected function parseGoogleVisionResponse(array $data): ?array
    {
        // This is a simplified placeholder
        // In production, you would need sophisticated text parsing
        // to extract CCCD fields from the OCR text
        return null;
    }
}
