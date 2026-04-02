<?php

namespace App\Console\Commands;

use App\Models\UserDebt;
use App\Models\Notification;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendOverdueReminders extends Command
{
    protected $signature = 'reminders:send-overdue';
    protected $description = 'Send overdue reminders to users with unpaid debts';

    public function handle(): int
    {
        $intervalDays = config('library.overdue_reminder_interval_days', 1);
        $maxReminders = config('library.overdue_reminder_count', 2);

        $overdueDebts = UserDebt::whereIn('status', ['pending', 'partial_paid'])
            ->where('due_date', '<', Carbon::now())
            ->where('reminder_count', '<', $maxReminders)
            ->where(function ($query) use ($intervalDays) {
                $query->whereNull('last_reminder_at')
                    ->orWhere('last_reminder_at', '<', Carbon::now()->subDays($intervalDays));
            })
            ->with('user')
            ->get();

        foreach ($overdueDebts as $debt) {
            // Increment reminder count
            $debt->incrementReminder();

            // Send notification
            $remainingDays = Carbon::now()->diffInDays($debt->due_date, false);
            $message = $remainingDays > 0
                ? "Bạn có khoản nợ " . number_format($debt->getRemainingAmount()) . " VNĐ quá hạn {$remainingDays} ngày."
                : "Bạn có khoản nợ " . number_format($debt->getRemainingAmount()) . " VNĐ đến hạn thanh toán.";

            Notification::create([
                'user_id' => $debt->user_id,
                'title' => 'Nhắc nhở thanh toán nợ',
                'content' => $message,
                'type' => 'web',
            ]);

            $this->info("Sent reminder for debt #{$debt->id} to user #{$debt->user_id}");
        }

        $this->info("Sent {$overdueDebts->count()} overdue reminders");

        return Command::SUCCESS;
    }
}
