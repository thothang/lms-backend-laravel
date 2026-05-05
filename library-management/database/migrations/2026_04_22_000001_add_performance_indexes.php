<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Helper function to check if index exists
        $indexExists = function (string $table, string $indexName): bool {
            return \Illuminate\Support\Facades\DB::select("
                SELECT 1 FROM pg_indexes 
                WHERE tablename = ? AND indexname = ?
            ", [$table, $indexName]) !== [];
        };

        // BorrowRecords - compound index for overdue queries
        if (!$indexExists('borrow_records', 'borrow_records_status_due_date_index')) {
            Schema::table('borrow_records', function (Blueprint $table) {
                $table->index(['status', 'due_date'], 'borrow_records_status_due_date_index');
            });
        }

        // BookCopies - index for available copies query
        if (!$indexExists('book_copies', 'book_copies_book_id_status_index')) {
            Schema::table('book_copies', function (Blueprint $table) {
                $table->index(['book_id', 'status'], 'book_copies_book_id_status_index');
            });
        }

        // Reservations - compound index for pending reservations
        if (!$indexExists('reservations', 'reservations_status_created_at_index')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'reservations_status_created_at_index');
            });
        }

        // Transactions - index for transaction history
        if (!$indexExists('transactions', 'transactions_type_created_at_index')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->index(['type', 'created_at'], 'transactions_type_created_at_index');
            });
        }

        // WithdrawalRequests - compound index for pending withdrawals
        if (!$indexExists('withdrawal_requests', 'withdrawal_requests_status_created_at_index')) {
            Schema::table('withdrawal_requests', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'withdrawal_requests_status_created_at_index');
            });
        }

        // Notifications - index for user notifications
        if (!$indexExists('notifications', 'notifications_user_id_is_read_created_at_index')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index(['user_id', 'is_read', 'created_at'], 'notifications_user_id_is_read_created_at_index');
            });
        }

        // AuditLogs - index for action logs
        if (!$indexExists('audit_logs', 'audit_logs_action_created_at_index')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->index(['action', 'created_at'], 'audit_logs_action_created_at_index');
            });
        }

        // Messages - index for user conversations
        if (!$indexExists('messages', 'messages_sender_id_receiver_id_created_at_index')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->index(['sender_id', 'receiver_id', 'created_at'], 'messages_sender_id_receiver_id_created_at_index');
            });
        }

        // Reviews - index for rating queries (on book_id)
        if (!$indexExists('reviews', 'reviews_book_id_rating_index')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->index(['book_id', 'rating'], 'reviews_book_id_rating_index');
            });
        }

        // ContactMessages - index for pending contacts
        if (!$indexExists('contact_messages', 'contact_messages_status_created_at_index')) {
            Schema::table('contact_messages', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'contact_messages_status_created_at_index');
            });
        }
    }

    public function down(): void
    {
        Schema::table('borrow_records', function (Blueprint $table) {
            $table->dropIndex(['borrow_records_status_due_date_index']);
        });
        Schema::table('book_copies', function (Blueprint $table) {
            $table->dropIndex(['book_copies_book_id_status_index']);
        });
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['reservations_status_created_at_index']);
        });
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['transactions_type_created_at_index']);
        });
        Schema::table('withdrawal_requests', function (Blueprint $table) {
            $table->dropIndex(['withdrawal_requests_status_created_at_index']);
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifications_user_id_is_read_created_at_index']);
        });
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['audit_logs_action_created_at_index']);
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['messages_sender_id_receiver_id_created_at_index']);
        });
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['reviews_book_id_rating_index']);
        });
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex(['contact_messages_status_created_at_index']);
        });
    }
};
