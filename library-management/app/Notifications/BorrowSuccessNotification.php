<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BorrowSuccessNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $bookTitle,
        public string $dueDate
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Xác nhận mượn sách thành công')
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->line('Bạn đã mượn thành công sách: **' . $this->bookTitle . '**')
            ->line('Ngày hết hạn: ' . $this->dueDate)
            ->line('Vui lòng trả sách đúng hạn để tránh phí phạt.')
            ->action('Xem chi tiết', url('/my-borrows'))
            ->line('Cảm ơn bạn đã sử dụng thư viện!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'borrow_success',
            'book_title' => $this->bookTitle,
            'due_date' => $this->dueDate,
        ];
    }
}
