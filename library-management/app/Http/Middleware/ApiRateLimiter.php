<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * Handle an incoming request with rate limiting
     */
    public function handle(Request $request, Closure $next, string $type = 'default'): Response
    {
        $key = $this->resolveRequestKey($request);
        $maxAttempts = $this->getMaxAttempts($type);
        $decayMinutes = $this->getDecayMinutes($type);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($key);
            
            return response()->json([
                'error' => 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', $retryAfter);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, $maxAttempts));
        $response->headers->set('X-RateLimit-Reset', RateLimiter::availableIn($key));

        return $response;
    }

    /**
     * Resolve the rate limit key for the request
     */
    protected function resolveRequestKey(Request $request): string
    {
        // Use user ID if authenticated, otherwise use IP
        $user = $request->user();
        
        if ($user) {
            return 'api_user_' . $user->id;
        }

        return 'api_ip_' . $request->ip();
    }

    /**
     * Get max attempts based on type
     */
    protected function getMaxAttempts(string $type): int
    {
        return match($type) {
            'auth' => 5,          // Login/Register: 5 attempts per minute
            'sensitive' => 10,    // Password change, payment: 10 per minute
            'search' => 30,       // Search: 30 per minute
            'default' => 120,     // Default: 120 per minute
            'strict' => 15,       // Strict: 15 per minute
            default => 120,
        };
    }

    /**
     * Get decay minutes based on type
     */
    protected function getDecayMinutes(string $type): int
    {
        return match($type) {
            'auth' => 1,          // 1 minute for auth
            'sensitive' => 1,     // 1 minute for sensitive
            'search' => 1,        // 1 minute for search
            'default' => 1,       // 1 minute default
            'strict' => 1,        // 1 minute strict
            default => 1,
        };
    }
}