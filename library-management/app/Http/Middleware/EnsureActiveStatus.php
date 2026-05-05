<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureActiveStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if ($user && $user->status !== 'active') {
            return response()->json([
                'error' => 'Vui lòng xác thực email của bạn để sử dụng tính năng này.',
                'status' => 'unverified'
            ], 403);
        }

        return $next($request);
    }
}
