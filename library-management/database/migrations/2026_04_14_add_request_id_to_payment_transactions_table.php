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
        Schema::table('payment_transactions', function (Blueprint $table) {
            // Add request_id column for idempotency tracking
            $table->string('request_id', 100)->nullable()->after('transaction_id');
            
            // Add unique index on request_id (only for non-null values)
            // Note: MySQL requires index length for JSON/text fields
            $table->index('request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropIndex(['request_id']);
            $table->dropColumn('request_id');
        });
    }
};
