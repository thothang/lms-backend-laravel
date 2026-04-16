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
        Schema::table('messages', function (Blueprint $table) {
            // Rename old columns
            $table->renameColumn('from_user_id', 'sender_id');
            $table->renameColumn('to_user_id', 'receiver_id');
            $table->renameColumn('message', 'content');
            
            // Add title column
            $table->string('title', 255)->nullable()->after('receiver_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->renameColumn('sender_id', 'from_user_id');
            $table->renameColumn('receiver_id', 'to_user_id');
            $table->renameColumn('content', 'message');
            $table->dropColumn('title');
        });
    }
};
