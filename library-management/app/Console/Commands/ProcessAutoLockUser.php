<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserDebt;
use App\Models\AuditLog;
use Illuminate\Console\Command;
use Carbon\Carbon;

class ProcessAutoLockUser extends Command
{
    protected $signature = 'users:auto-lock';
    protected $description = 'Auto lock users with overdue unpaid debts';

    public function handle(): int
    {
        $dueDays = config('library.debt_due_days', 7);

        $usersToLock = User::where('status', 'active')
            ->where('total_debt', '>', 0)
            ->whereHas('debts', function ($query) use ($dueDays) {
                $query->whereIn('status', ['pending', 'partial_paid'])
                    ->where('due_date', '<', Carbon::now()->subDays($dueDays));
            })
            ->get();

        foreach ($usersToLock as $user) {
            $user->update(['status' => 'locked']);

            AuditLog::log(
                0, // System
                'AUTO_LOCK',
                'users',
                $user->id,
                ['status' => 'active'],
                ['status' => 'locked', 'reason' => 'overdue_debt']
            );

            $this->info("Auto-locked user #{$user->id}: {$user->name}");
        }

        $this->info("Locked {$usersToLock->count()} users with overdue debts");

        return self::SUCCESS;
    }
}
