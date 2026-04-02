<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ebook_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ebook_id')->constrained('ebooks')->onDelete('cascade');
            $table->timestamp('purchase_date');
            $table->decimal('amount', 12, 2);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('ebook_id');
            // Unique constraint: user can only purchase each ebook once
            $table->unique(['user_id', 'ebook_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ebook_purchases');
    }
};
