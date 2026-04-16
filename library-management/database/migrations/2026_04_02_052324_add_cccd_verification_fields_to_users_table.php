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
            // CCCD verification status: unverified, ocr_verified, pending_review, verified, rejected
            $table->string('cccd_verified', 30)->default('unverified')->after('cccd_image');
            // OCR extracted data for admin/librarian to review
            $table->json('cccd_ocr_data')->nullable()->after('cccd_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cccd_verified', 'cccd_ocr_data']);
        });
    }
};
