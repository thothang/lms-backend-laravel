<?php

namespace App\Console\Commands;

use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDuplicateTopups extends Command
{
    protected $signature = 'app:fix-duplicate-topups {--dry-run : Chỉ hiển thị không thực hiện}';
    protected $description = 'Xóa các topup trùng lặp và hoàn tiền cho user nếu bị trừ 2 lần';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        
        $this->info('=== Tìm các topup trùng lặp ===');
        
        // Tìm các transaction_id trùng lặp (count > 1)
        $duplicates = PaymentTransaction::select('transaction_id')
            ->where('type', 'topup')
            ->whereNotNull('transaction_id')
            ->groupBy('transaction_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();
        
        if ($duplicates->isEmpty()) {
            $this->info('Không có topup trùng lặp!');
            return Command::SUCCESS;
        }
        
        $this->warn('Tìm thấy ' . $duplicates->count() . ' giao dịch trùng lặp:');
        
        foreach ($duplicates as $dup) {
            $records = PaymentTransaction::where('transaction_id', $dup->transaction_id)
                ->where('type', 'topup')
                ->orderBy('id')
                ->get();
            
            $this->line("Transaction ID: {$dup->transaction_id}");
            foreach ($records as $record) {
                $user = User::find($record->user_id);
                $this->line("  - ID: {$record->id}, User ID: {$record->user_id} ({$user->name ?? 'N/A'}), Amount: " . number_format($record->amount) . " VND, Time: {$record->created_at}");
            }
            
            // Giữ lại record đầu tiên, xóa các record còn lại
            $firstRecord = $records->first();
            $recordsToDelete = $records->skip(1);
            
            foreach ($recordsToDelete as $record) {
                if (!$dryRun) {
                    // Trừ lại số tiền đã cộng 2 lần (trừ 1 lần)
                    $user = User::find($record->user_id);
                    if ($user) {
                        $user->decrement('balance', $record->amount);
                        $this->line("  Đã trừ {$record->amount} VND từ user {$user->id}");
                    }
                    
                    $record->delete();
                    $this->line("  Đã xóa duplicate record ID: {$record->id}");
                } else {
                    $this->line("  [DRY-RUN] Sẽ xóa record ID: {$record->id} và trừ tiền");
                }
            }
            
            $this->line('');
        }
        
        $this->info('=== Hoàn tất ===');
        
        return Command::SUCCESS;
    }
}
