<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        $allowedOrigins = config('cors.allowed_origins', ['*']);
        $origin = $request->header('Origin');

        // Determine if the origin is allowed
        if (in_array('*', $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin ?: '*');
        } elseif ($origin && in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');

        // CSP header for API responses
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "connect-src 'self' https://pay-sandbox.sepay.vn; " .
            "img-src 'self' * data: blob:; " .
            "style-src 'self' 'unsafe-inline'; " .
            "frame-src https://pay-sandbox.sepay.vn; " .
            "font-src 'self' data:;"
        );

        return $response;
    }
}
