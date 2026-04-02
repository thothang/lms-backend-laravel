<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrow_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('restrict');
            $table->string('guest_name')->nullable();
            $table->string('guest_phone', 20)->nullable();
            $table->string('guest_cccd', 20)->nullable();
            $table->foreignId('copy_id')->constrained('book_copies')->onDelete('restrict');
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->decimal('daily_fee_applied', 12, 2);
            $table->decimal('deposit_amount', 12, 2);
            $table->integer('renew_count')->default(0);
            $table->string('status', 30)->default('active'); // 'active', 'returned', 'overdue', 'lost', 'pending_return'
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('copy_id');
            $table->index('status');
            $table->index('due_date');
            $table->index('borrow_date');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrow_records');
    }
};
