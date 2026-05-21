<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use App\Services\SepayGateway;
use Illuminate\Console\Command;
use Carbon\Carbon;

class RetryFailedSepayTransactions extends Command
{
    protected $signature = 'transactions:retry-failed-sepay';
    protected $description = 'Retry failed or pending Sepay transactions older than 15 minutes';

    protected $sepayGateway;

    public function __construct(SepayGateway $sepayGateway)
    {
        parent::__construct();
        $this->sepayGateway = $sepayGateway;
    }

    public function handle(): int
    {
        $pendingTransactions = Transaction::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(15))
            ->where('payment_gateway', 'Sepay')
            ->whereNotNull('gateway_transaction_id')
            ->get();

        foreach ($pendingTransactions as $transaction) {
            $result = $this->sepayGateway->checkTransactionStatus($transaction->gateway_transaction_id);

            if ($result['success'] && isset($result['data']['status'])) {
                $status = $result['data']['status'];

                if ($status === 'success') {
                    $transaction->markSuccess();
                    $this->info("Marked transaction #{$transaction->id} as success");
                } elseif ($status === 'failed') {
                    $transaction->update(['status' => 'failed']);
                    $this->info("Marked transaction #{$transaction->id} as failed");
                }
            }
        }

        $this->info("Processed {$pendingTransactions->count()} pending Sepay transactions");

        return self::SUCCESS;
    }
}
