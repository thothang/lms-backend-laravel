<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Events\ReservationExpired;
use Illuminate\Console\Command;
use Carbon\Carbon;

class ProcessExpiredReservations extends Command
{
    protected $signature = 'reservations:process-expired';
    protected $description = 'Process expired reservations and mark them as expired';

    public function handle(): int
    {
        $expiredReservations = Reservation::where('status', 'pending')
            ->where('expiry_date', '<', Carbon::now())
            ->get();

        foreach ($expiredReservations as $reservation) {
            $reservation->update(['status' => 'expired']);

            // Broadcast event
            broadcast(new ReservationExpired($reservation));

            $this->info("Marked reservation #{$reservation->id} as expired");
        }

        $this->info("Processed {$expiredReservations->count()} expired reservations");

        return Command::SUCCESS;
    }
}
