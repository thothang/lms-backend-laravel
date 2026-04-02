<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('book_id')->constrained('books')->onDelete('cascade');
            $table->foreignId('copy_id')->nullable()->constrained('book_copies')->onDelete('set null');
            $table->integer('expected_borrow_days')->default(9); // 1-9
            $table->timestamp('reservation_date')->useCurrent();
            $table->timestamp('expiry_date')->useCurrent();
            $table->decimal('fee_paid', 12, 2); // 10% of estimated borrow fee
            $table->string('status', 20)->default('pending');
            $table->integer('queue_order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('book_id');
            $table->index('status');
            $table->index('reservation_date');
            $table->index('expiry_date');
            $table->index('queue_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
