<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 14, 2);
            $table->json('bank_account_info');
            $table->string('status', 20)->default('pending'); // 'pending', 'approved', 'rejected', 'completed'
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('author_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
