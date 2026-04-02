<?php

namespace App\Events;

use App\Models\BorrowRecord;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BorrowStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public BorrowRecord $borrowRecord;
    public string $status;
    public ?string $message;

    public function __construct(BorrowRecord $borrowRecord, string $status, ?string $message = null)
    {
        $this->borrowRecord = $borrowRecord;
        $this->status = $status;
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        if ($this->borrowRecord->user_id) {
            return ['private-user.' . $this->borrowRecord->user_id];
        }
        return [];
    }

    public function broadcastAs(): string
    {
        return 'BorrowStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'borrow_id' => $this->borrowRecord->id,
            'status' => $this->status,
            'message' => $this->message,
            'book_title' => $this->borrowRecord->book_title ?? null,
        ];
    }
}
