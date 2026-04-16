<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TopupSuccessNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public float $amount,
        public float $newBalance
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nạp tiền thành công')
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->success()
            ->line('Bạn đã nạp thành công: **' . number_format($this->amount) . ' VND**')
            ->line('Số dư mới: **' . number_format($this->newBalance) . ' VND**')
            ->line('Cảm ơn bạn đã sử dụng dịch vụ!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'topup_success',
            'amount' => $this->amount,
            'new_balance' => $this->newBalance,
        ];
    }
}
