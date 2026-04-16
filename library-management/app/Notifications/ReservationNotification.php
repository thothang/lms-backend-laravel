<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $bookTitle,
        public string $status, // fulfilled, expired, cancelled
        public int $queuePosition = 0
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Thông báo đặt trước sách');

        switch ($this->status) {
            case 'fulfilled':
                $mail->success()
                    ->greeting('Xin chào ' . $notifiable->name . '!')
                    ->line('Sách **' . $this->bookTitle . '** đã có sẵn và bạn có thể đến lấy.')
                    ->line('Vui lòng đến thư viện trong thời hạn quy định.')
                    ->action('Xem chi tiết', url('/my-reservations'));
                break;
            case 'expired':
                $mail->error()
                    ->greeting('Xin chào ' . $notifiable->name . '!')
                    ->line('Đặt trước sách **' . $this->bookTitle . '** đã hết hạn.')
                    ->line('Phí đặt trước không được hoàn lại.');
                break;
            case 'cancelled':
                $mail->warning()
                    ->greeting('Xin chào ' . $notifiable->name . '!')
                    ->line('Đặt trước sách **' . $this->bookTitle . '** đã bị hủy.')
                    ->line('Phí đặt trước không được hoàn lại.');
                break;
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'reservation',
            'book_title' => $this->bookTitle,
            'status' => $this->status,
            'queue_position' => $this->queuePosition,
        ];
    }
}
