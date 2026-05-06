<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Fix duplicate topups command
Artisan::command('fix:duplicate-topups', function () {
    $this->call('app:fix-duplicate-topups');
})->purpose('Fix duplicate topup transactions');

// Schedule Background Jobs
Schedule::command('reservations:process-expired')->hourly();
Schedule::command('borrows:check-overdue')->dailyAt('00:00');
Schedule::command('reminders:send-overdue')->dailyAt('08:00');
Schedule::command('users:auto-lock')->dailyAt('09:00');
Schedule::command('books:remove-new-tag')->daily();
Schedule::command('transactions:retry-failed-sepay')->everyFiveMinutes();
Schedule::command('borrows:expire-pending-pickups')->hourly();
Schedule::command('users:sync-total-debt')->hourly();
