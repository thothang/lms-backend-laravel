<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author_name');
            $table->string('publisher')->nullable();
            $table->foreignId('category_id')->constrained('book_categories')->onDelete('restrict');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('daily_fee', 12, 2)->nullable(); // NULL uses default
            $table->boolean('is_hot')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->boolean('in_carousel')->default(false);
            $table->integer('carousel_order')->default(0);
            $table->integer('total_copies')->default(0);
            $table->integer('available_copies')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('category_id');
            $table->index('is_hot');
            $table->index('is_featured');
            $table->index('in_carousel');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
