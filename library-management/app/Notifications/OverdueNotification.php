<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $bookTitle,
        public int $daysOverdue,
        public float $penaltyAmount
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Cảnh báo: Sách đã quá hạn')
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->warning()
            ->line('Sách **' . $this->bookTitle . '** đã quá hạn **' . $this->daysOverdue . ' ngày**.')
            ->line('Phí phạt hiện tại: **' . number_format($this->penaltyAmount) . ' VND**')
            ->line('Vui lòng trả sách và thanh toán phí phạt sớm nhất có thể.')
            ->action('Xem chi tiết', url('/my-borrows'))
            ->line('Nếu không trả sách, tài khoản của bạn có thể bị khóa.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'overdue',
            'book_title' => $this->bookTitle,
            'days_overdue' => $this->daysOverdue,
            'penalty_amount' => $this->penaltyAmount,
        ];
    }
}
