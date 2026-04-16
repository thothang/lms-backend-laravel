<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ebooks', function (Blueprint $table) {
            $table->string('author_name')->nullable()->after('author_id');
            $table->boolean('uploaded_by_admin')->default(false)->after('is_free');
        });
    }

    public function down(): void
    {
        Schema::table('ebooks', function (Blueprint $table) {
            $table->dropColumn(['author_name', 'uploaded_by_admin']);
        });
    }
};
