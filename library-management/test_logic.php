<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\BookCopy;
use App\Services\BorrowService;
use App\Models\BorrowRecord;
use Carbon\Carbon;

$user = User::where('role', 'user')->first();
$copy = BookCopy::where('status', 'available')->first();

if (!$user || !$copy) {
    die("No user or copy found for testing.\n");
}

echo "--- START TEST ---\n";
echo "Initial Balance: " . $user->balance . "\n";

$borrowService = app(BorrowService::class);
// Borrow for 10 days
$res = $borrowService->borrow($user, $copy, 10);

if (!$res['success']) {
    die("Borrow Failed: " . $res['message'] . "\n");
}

$br = $res['borrow_record'];
$br = BorrowRecord::find($br->id); // Fresh find
echo "Borrowed! ID: {$br->id}\n";
echo "Deposit Hold: {$br->deposit_amount}\n";
echo "Prepaid Fee (10 days): {$br->prepaid_amount}\n";
echo "New Balance: " . $user->fresh()->balance . "\n";

// Now simulate return after 1 day
echo "\n--- SIMULATING RETURN AFTER 1 DAY ---\n";
// Manually adjust the dates for simulation (can't easily do it via service as it uses Carbon::now())
// But let's check calculateFee
$br->borrow_date = Carbon::now()->subDay();
$br->return_date = Carbon::now();
$br->save();

$feeData = $br->calculateFee();
echo "Actual Days used: " . $feeData['total_days'] . "\n";
echo "Actual Fee: " . $feeData['borrow_fee'] . "\n";
echo "Total Held (Deposit+Prepaid): " . $feeData['total_held'] . "\n";
echo "Refund expected: " . $feeData['refund'] . "\n";

// Execute return via service (will use Carbon::now(), so it'll match our subDay simulation)
$returnRes = $borrowService->returnBook($br);
echo "\n--- RETURN EXECUTED ---\n";
echo "Refund Amount: " . ($returnRes['refund'] ?? 0) . "\n";
echo "Final Balance: " . $user->fresh()->balance . "\n";
echo "Actual Fee stored: " . $br->fresh()->actual_fee . "\n";
echo "--- TEST COMPLETE ---\n";
