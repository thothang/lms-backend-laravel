<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Exception;

trait HandlesApiExceptions
{
    /**
     * Wrap a callback with try-catch for API error handling
     *
     * @param callable $callback
     * @param string $errorMessage
     * @return SymfonyResponse
     */
    protected function withApiExceptionHandling(callable $callback, string $errorMessage = 'Có lỗi xảy ra'): \Symfony\Component\HttpFoundation\Response
    {
        try {
            return $callback();
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Dữ liệu không hợp lệ',
                'details' => $e->errors()
            ], 422);
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json([
                'error' => 'Token đã hết hạn'
            ], 401);
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json([
                'error' => 'Token không hợp lệ'
            ], 401);
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return response()->json([
                'error' => 'Lỗi xác thực'
            ], 401);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Không tìm thấy dữ liệu'
            ], 404);
        } catch (Exception $e) {
            Log::error($errorMessage . ': ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => $errorMessage . ': ' . $e->getMessage()
            ], 500);
        }
    }
}
