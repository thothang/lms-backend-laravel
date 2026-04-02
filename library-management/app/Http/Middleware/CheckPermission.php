<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'error' => 'Người dùng không tồn tại',
                ], 401);
            }

            // Admin has all permissions
            if ($user->isAdmin()) {
                return $next($request);
            }

            // Check if user has the specific permission
            if (!$user->hasPermission($permission)) {
                return response()->json([
                    'error' => 'Bạn không có quyền thực hiện hành động này',
                ], 403);
            }

        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Token không hợp lệ',
            ], 401);
        }

        return $next($request);
    }
}
