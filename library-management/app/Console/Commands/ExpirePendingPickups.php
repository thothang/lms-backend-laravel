<?php

namespace App\Console\Commands;

use App\Models\BorrowRecord;
use App\Services\BorrowService;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ExpirePendingPickups extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'borrows:expire-pending-pickups';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire pending pickup borrow requests after timeout and charge 1-day fee';

    /**
     * Execute the console command.
     */
    public function handle(BorrowService $borrowService): int
    {
        $timeoutDays = config('library.pending_pickup_expiry_days', 1);
        $expiryDate = Carbon::now()->subDays($timeoutDays);

        $expiredBorrows = BorrowRecord::where('status', 'pending_pickup')
            ->where('borrow_date', '<', $expiryDate)
            ->get();

        if ($expiredBorrows->isEmpty()) {
            $this->info('No expired pending pickup requests found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$expiredBorrows->count()} expired pending pickup requests.");

        foreach ($expiredBorrows as $borrow) {
            try {
                $result = $borrowService->expirePendingPickup($borrow);
                if ($result['success']) {
                    $this->info("Successfully expired borrow #{$borrow->id}. Penalty: " . number_format($result['penalty_fee']) . " VNĐ.");
                } else {
                    $this->error("Failed to expire borrow #{$borrow->id}: {$result['message']}");
                }
            } catch (\Exception $e) {
                $this->error("Error processing borrow #{$borrow->id}: {$e->getMessage()}");
                Log::error("Error expiring pending pickup #{$borrow->id}: " . $e->getMessage());
            }
        }

        $this->info('Expiration process completed.');
        return Command::SUCCESS;
    }
}
