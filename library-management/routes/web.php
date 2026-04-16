<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PaymentController;

Route::get('/', function () {
    return view('welcome');
});

// Payment callback routes for SePay redirect - return HTML auto-redirect
Route::get('/payment/success', function () {
    return '<html><head><meta http-equiv="refresh" content="0;url=http://localhost:5173/payment/success"></head><body><p>Redirecting...</p></body></html>';
});

Route::get('/payment/error', function () {
    return '<html><head><meta http-equiv="refresh" content="0;url=http://localhost:5173/payment/error"></head><body><p>Redirecting...</p></body></html>';
});

Route::get('/payment/cancel', function () {
    return '<html><head><meta http-equiv="refresh" content="0;url=http://localhost:5173/payment/cancel"></head><body><p>Redirecting...</p></body></html>';
});
