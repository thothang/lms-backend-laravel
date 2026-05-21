<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('type');
            $table->index('status');
        });

        Schema::table('ebooks', function (Blueprint $table) {
            $table->index('author_id');
            $table->index('status');
        });

        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->index('status');
        });
        
        Schema::table('borrow_records', function (Blueprint $table) {
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            //
        });
    }
};
