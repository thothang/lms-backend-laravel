<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'error' => 'Người dùng không tồn tại',
                ], 401);
            }

            // Check if user has one of the required roles
            if (!in_array($user->role, $roles)) {
                return response()->json([
                    'error' => 'Bạn không có quyền truy cập trang này',
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
