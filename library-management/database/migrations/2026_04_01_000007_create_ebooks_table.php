<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ebooks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('file_path'); // Private storage
            $table->integer('free_preview_pages')->default(0);
            $table->string('status', 20)->default('pending'); // 'pending', 'approved', 'rejected'
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_free')->default(false);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('author_id');
            $table->index('status');
            $table->index('is_free');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ebooks');
    }
};
