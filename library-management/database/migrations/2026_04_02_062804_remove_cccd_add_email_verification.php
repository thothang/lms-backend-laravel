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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cccd_number', 'cccd_image', 'cccd_verified', 'cccd_ocr_data']);
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->string('verification_token')->nullable()->after('email_verified_at');
        });

        Schema::table('borrow_records', function (Blueprint $table) {
            $table->dropColumn('guest_cccd');
        });

        Schema::table('role_permissions', function (Blueprint $table) {
            $table->dropColumn('can_verify_cccd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cccd_number')->nullable();
            $table->string('cccd_image')->nullable();
            $table->string('cccd_verified', 30)->default('unverified');
            $table->json('cccd_ocr_data')->nullable();
            
            $table->dropColumn(['email_verified_at', 'verification_token']);
        });

        Schema::table('borrow_records', function (Blueprint $table) {
            $table->string('guest_cccd', 20)->nullable();
        });

        Schema::table('role_permissions', function (Blueprint $table) {
            $table->boolean('can_verify_cccd')->default(false);
        });
    }
};
