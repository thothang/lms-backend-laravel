<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\TokenBlacklistedException;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Http\Middleware\CheckRole;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Disable guest redirect for API
        $middleware->redirectGuestsTo(fn () => null);

        // Register role middleware alias
        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle JWT Token Expired
        $exceptions->render(function (TokenExpiredException $e, Request $request) {
            return response()->json([
                'error' => 'Token has expired',
                'message' => 'Token đã hết hạn. Vui lòng đăng nhập lại.',
            ], 401);
        });

        // Handle JWT Token Invalid
        $exceptions->render(function (TokenInvalidException $e, Request $request) {
            return response()->json([
                'error' => 'Token is invalid',
                'message' => 'Token không hợp lệ.',
            ], 401);
        });

        // Handle JWT Blacklist (token already used)
        $exceptions->render(function (JWTException $e, Request $request) {
            return response()->json([
                'error' => 'Token error',
                'message' => $e->getMessage(),
            ], 401);
        });

        // Handle Token Blacklisted (after logout)
        $exceptions->render(function (TokenBlacklistedException $e, Request $request) {
            return response()->json([
                'error' => 'Token has been blacklisted',
                'message' => 'Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại.',
            ], 401);
        });

        // Handle authentication exceptions for API routes
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'Vui lòng đăng nhập để tiếp tục.',
                ], 401);
            }
        });

        // Handle access denied for API
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => 'Access denied',
                    'message' => 'Bạn không có quyền truy cập tài nguyên này.',
                ], 403);
            }
        });

        // Handle not found for API
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'Endpoint không tồn tại.',
                ], 404);
            }
        });
    })->create();
