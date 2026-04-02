<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 14, 2);
            $table->string('type', 30); // 'deposit', 'borrow_fee', 'penalty', 'ebook_purchase', 'library_ticket', 'withdrawal', 'deposit_hold', 'deposit_refund'
            $table->string('status', 20)->default('pending'); // 'pending', 'success', 'failed'
            $table->string('payment_gateway', 50)->default('Sepay');
            $table->string('gateway_transaction_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('type');
            $table->index('status');
            $table->index('gateway_transaction_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
