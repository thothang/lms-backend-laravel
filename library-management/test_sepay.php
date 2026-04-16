<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$gw = app(\App\Services\SepayGateway::class);

$urls = [
    'success' => route('payment.success'),
    'error'   => route('payment.error'),
    'cancel'  => route('payment.cancel'),
];

echo "=== Callback URLs ===\n";
print_r($urls);

echo "\n=== Form HTML ===\n";
try {
    $html = $gw->getCheckoutFormHtml(50000, 'TEST-001', $urls);
    echo $html . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
