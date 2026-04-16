<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'borrow_record_id',
        'transaction_id',
        'request_id',
        'order_id',
        'order_invoice_number',
        'type',
        'amount',
        'currency',
        'payment_method',
        'transaction_status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'amount' => 'float',
    ];

    // Type constants
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_TOPUP = 'topup';
    const TYPE_FINE = 'fine';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function borrowRecord()
    {
        return $this->belongsTo(BorrowRecord::class);
    }
}