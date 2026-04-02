<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 14, 2); // Original debt amount
            $table->decimal('paid_amount', 14, 2)->default(0); // Amount already paid
            $table->string('reason', 50); // 'overdue_penalty', 'lost_book_damage'
            $table->foreignId('borrow_record_id')->nullable()->constrained('borrow_records')->onDelete('set null');
            $table->string('status', 20)->default('pending'); // 'pending', 'partial_paid', 'paid', 'written_off'
            $table->integer('reminder_count')->default(0);
            $table->timestamp('last_reminder_at')->nullable();
            $table->timestamp('due_date')->nullable(); // 7 days from creation
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('borrow_record_id');
            $table->index('status');
            $table->index('due_date');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_debts');
    }
};
