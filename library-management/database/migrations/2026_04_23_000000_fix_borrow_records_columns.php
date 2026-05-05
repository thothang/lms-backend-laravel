<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename return_date to actual_return_date if it exists
        if (Schema::hasColumn('borrow_records', 'return_date')) {
            Schema::table('borrow_records', function (Blueprint $table) {
                $table->renameColumn('return_date', 'actual_return_date');
            });
        }

        // Add missing columns if they don't exist
        Schema::table('borrow_records', function (Blueprint $table) {
            if (!Schema::hasColumn('borrow_records', 'prepaid_amount')) {
                $table->decimal('prepaid_amount', 12, 2)->default(0)->after('actual_return_date');
            }
            if (!Schema::hasColumn('borrow_records', 'actual_fee')) {
                $table->decimal('actual_fee', 12, 2)->default(0)->after('prepaid_amount');
            }
            if (!Schema::hasColumn('borrow_records', 'guest_email')) {
                $table->string('guest_email', 255)->nullable()->after('guest_name');
            }
            if (!Schema::hasColumn('borrow_records', 'deposit_refunded_at')) {
                $table->timestamp('deposit_refunded_at')->nullable()->after('actual_fee');
            }
            if (!Schema::hasColumn('borrow_records', 'actual_pickup_date')) {
                $table->timestamp('actual_pickup_date')->nullable()->after('borrow_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('borrow_records', function (Blueprint $table) {
            if (Schema::hasColumn('borrow_records', 'actual_return_date')) {
                $table->renameColumn('actual_return_date', 'return_date');
            }
        });
    }
};
