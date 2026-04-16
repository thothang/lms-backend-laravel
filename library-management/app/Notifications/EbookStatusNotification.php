<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EbookStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $ebookTitle,
        public string $status, // approved, rejected
        public ?string $rejectionReason = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Thông báo về ebook của bạn');

        if ($this->status === 'approved') {
            return $mail->success()
                ->greeting('Xin chào ' . $notifiable->name . '!')
                ->line('Ebook **' . $this->ebookTitle . '** đã được duyệt và sẵn sàng bán.')
                ->line('Doanh thu từ ebook sẽ được cộng vào tài khoản của bạn.')
                ->action('Xem chi tiết', url('/author/ebooks'));
        }

        return $mail->error()
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->line('Ebook **' . $this->ebookTitle . '** đã bị từ chối.')
            ->line('Lý do: ' . ($this->rejectionReason ?? 'Không có'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ebook_status',
            'ebook_title' => $this->ebookTitle,
            'status' => $this->status,
            'rejection_reason' => $this->rejectionReason,
        ];
    }
}
