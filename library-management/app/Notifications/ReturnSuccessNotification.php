<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReturnSuccessNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $bookTitle,
        public float $refundAmount,
        public string $returnDate
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Xác nhận trả sách thành công')
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->line('Bạn đã trả sách thành công: **' . $this->bookTitle . '**')
            ->line('Ngày trả: ' . $this->returnDate);

        if ($this->refundAmount > 0) {
            $mail->line('Tiền cọc được hoàn: **' . number_format($this->refundAmount) . ' VND**');
        }

        return $mail
            ->line('Cảm ơn bạn đã sử dụng thư viện!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'return_success',
            'book_title' => $this->bookTitle,
            'refund_amount' => $this->refundAmount,
            'return_date' => $this->returnDate,
        ];
    }
}
