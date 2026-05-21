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
        \DB::statement('CREATE INDEX IF NOT EXISTS transactions_type_index ON transactions(type)');
        \DB::statement('CREATE INDEX IF NOT EXISTS transactions_status_index ON transactions(status)');
        
        \DB::statement('CREATE INDEX IF NOT EXISTS ebooks_author_id_index ON ebooks(author_id)');
        \DB::statement('CREATE INDEX IF NOT EXISTS ebooks_status_index ON ebooks(status)');
        
        \DB::statement('CREATE INDEX IF NOT EXISTS withdrawal_requests_status_index ON withdrawal_requests(status)');
        
        \DB::statement('CREATE INDEX IF NOT EXISTS borrow_records_status_index ON borrow_records(status)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \DB::statement('DROP INDEX IF EXISTS transactions_type_index');
        \DB::statement('DROP INDEX IF EXISTS transactions_status_index');
        
        \DB::statement('DROP INDEX IF EXISTS ebooks_author_id_index');
        \DB::statement('DROP INDEX IF EXISTS ebooks_status_index');
        
        \DB::statement('DROP INDEX IF EXISTS withdrawal_requests_status_index');
        
        \DB::statement('DROP INDEX IF EXISTS borrow_records_status_index');
    }
};
