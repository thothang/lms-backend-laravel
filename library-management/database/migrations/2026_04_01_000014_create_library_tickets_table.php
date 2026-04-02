<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('purchase_date');
            $table->date('valid_from');
            $table->date('valid_to');
            $table->decimal('amount', 12, 2);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('valid_from');
            $table->index('valid_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_tickets');
    }
};
