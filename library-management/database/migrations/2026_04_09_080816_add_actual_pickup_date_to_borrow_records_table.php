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
        Schema::table('borrow_records', function (Blueprint $table) {
            $table->timestamp('actual_pickup_date')->nullable()->after('borrow_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrow_records', function (Blueprint $table) {
            $table->dropColumn('actual_pickup_date');
        });
    }
};
