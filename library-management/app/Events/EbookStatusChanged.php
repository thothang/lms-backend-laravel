<?php

namespace App\Events;

use App\Models\Ebook;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EbookStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Ebook $ebook;
    public string $status;
    public ?string $rejectionReason;

    public function __construct(Ebook $ebook, string $status, ?string $rejectionReason = null)
    {
        $this->ebook = $ebook;
        $this->status = $status;
        $this->rejectionReason = $rejectionReason;
    }

    public function broadcastOn(): array
    {
        return ['private-user.' . $this->ebook->author_id];
    }

    public function broadcastAs(): string
    {
        return 'EbookStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'ebook_id' => $this->ebook->id,
            'status' => $this->status,
            'rejection_reason' => $this->rejectionReason,
        ];
    }
}
