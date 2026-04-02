<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncUserTotalDebt extends Command
{
    protected $signature = 'users:sync-total-debt';
    protected $description = 'Synchronize total_debt column in users table from user_debts';

    public function handle(): int
    {
        $users = User::all();

        foreach ($users as $user) {
            $totalDebt = DB::table('user_debts')
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending', 'partial_paid'])
                ->selectRaw('SUM(amount - paid_amount) as total')
                ->value('total') ?? 0;

            if ($user->total_debt != $totalDebt) {
                $user->update(['total_debt' => $totalDebt]);
                $this->info("Synced user #{$user->id}: total_debt = {$totalDebt}");
            }
        }

        $this->info("Synced debt for {$users->count()} users");

        return Command::SUCCESS;
    }
}
