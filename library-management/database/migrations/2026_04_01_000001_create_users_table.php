<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('cccd_number')->nullable(); // Encrypted in model
            $table->string('cccd_image')->nullable(); // Private storage
            $table->date('dob')->nullable();
            $table->decimal('balance', 14, 2)->default(0);
            $table->decimal('earnings_balance', 14, 2)->default(0);
            $table->decimal('total_earned', 14, 2)->default(0);
            $table->decimal('total_debt', 14, 2)->default(0);
            $table->string('status', 20)->default('unverified'); // 'unverified', 'active', 'locked'
            $table->string('role', 20)->default('user'); // 'admin', 'librarian', 'user', 'author'
            $table->timestamp('last_withdrawal_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('role');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
