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
        Schema::table('ebooks', function (Blueprint $table) {
            $table->boolean('is_hot')->default(false)->after('uploaded_by_admin');
            $table->boolean('is_featured')->default(false)->after('is_hot');
            $table->boolean('in_carousel')->default(false)->after('is_featured');
            $table->integer('carousel_order')->default(0)->after('in_carousel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebooks', function (Blueprint $table) {
            $table->dropColumn(['is_hot', 'is_featured', 'in_carousel', 'carousel_order']);
        });
    }
};
