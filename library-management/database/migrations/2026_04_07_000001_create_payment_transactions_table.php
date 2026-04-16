<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('borrow_record_id')->nullable()->constrained()->onDelete('set null');
            $table->string('transaction_id')->nullable();
            $table->string('order_id')->nullable();
            $table->string('order_invoice_number')->nullable();
            $table->string('type'); // deposit, topup, fine
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('VND');
            $table->string('payment_method')->nullable();
            $table->string('transaction_status')->default('APPROVED');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index('transaction_id');
            $table->index('order_invoice_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};