<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('book_id')->nullable()->constrained('books')->onDelete('cascade');
            $table->foreignId('ebook_id')->nullable()->constrained('ebooks')->onDelete('cascade');
            $table->tinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->timestamps();

            // Constraints: Either book_id or ebook_id must be set, but not both
            // Indexes
            $table->index('user_id');
            $table->index('book_id');
            $table->index('ebook_id');
            // Unique: user can only review each book/ebook once
            $table->unique(['user_id', 'book_id']);
            $table->unique(['user_id', 'ebook_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
