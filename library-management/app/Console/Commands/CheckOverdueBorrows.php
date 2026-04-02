<?php

namespace App\Console\Commands;

use App\Models\BorrowRecord;
use App\Models\UserDebt;
use App\Models\User;
use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckOverdueBorrows extends Command
{
    protected $signature = 'borrows:check-overdue';
    protected $description = 'Check and mark overdue borrow records, calculate penalties';

    public function handle(): int
    {
        $overdueBorrows = BorrowRecord::where('status', 'active')
            ->where('due_date', '<', Carbon::now())
            ->get();

        foreach ($overdueBorrows as $borrowRecord) {
            DB::transaction(function () use ($borrowRecord) {
                // Mark as overdue
                $borrowRecord->update(['status' => 'overdue']);

                // Calculate penalty
                $daysOverdue = Carbon::now()->diffInDays($borrowRecord->due_date);
                $penaltyMultiplier = config('library.overdue_penalty_multiplier', 1.5);
                $dailyPenalty = $borrowRecord->daily_fee_applied * $penaltyMultiplier;
                $totalPenalty = $daysOverdue * $dailyPenalty;

                if ($totalPenalty > 0) {
                    $user = $borrowRecord->user;

                    // Create debt record
                    UserDebt::create([
                        'user_id' => $user->id,
                        'amount' => $totalPenalty,
                        'paid_amount' => 0,
                        'reason' => 'overdue_penalty',
                        'borrow_record_id' => $borrowRecord->id,
                        'due_date' => Carbon::now()->addDays(config('library.debt_due_days', 7)),
                    ]);

                    // Update user's total debt
                    $user->addDebt($totalPenalty);

                    // Create audit log
                    AuditLog::log(
                        0, // System
                        'OVERDUE_PENALTY',
                        'borrow_records',
                        $borrowRecord->id,
                        null,
                        ['penalty' => $totalPenalty, 'days_overdue' => $daysOverdue]
                    );
                }

                Log::info("Marked borrow #{$borrowRecord->id} as overdue, penalty: {$totalPenalty}");
            });

            $this->info("Processed overdue borrow #{$borrowRecord->id}");
        }

        $this->info("Processed {$overdueBorrows->count()} overdue borrows");

        return Command::SUCCESS;
    }
}
