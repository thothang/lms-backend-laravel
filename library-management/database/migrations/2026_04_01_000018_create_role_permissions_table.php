<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('librarian_id')->constrained('users')->onDelete('cascade');
            
            // Permissions (detailed permissions for librarian)
            $table->boolean('can_approve_ebook')->default(false);
            $table->boolean('can_manage_finance')->default(false);
            $table->boolean('can_manage_users')->default(false);
            $table->boolean('can_manage_books')->default(false);
            $table->boolean('can_manage_borrow_offline')->default(false);
            $table->boolean('can_manage_reservations')->default(false);
            $table->boolean('can_mark_lost_books')->default(false);
            $table->boolean('can_verify_cccd')->default(false);
            $table->boolean('can_view_reports')->default(false);
            $table->boolean('can_manage_hot_books')->default(false);
            $table->boolean('can_manage_messages')->default(false);

            $table->timestamps();

            // Index
            $table->index('librarian_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
