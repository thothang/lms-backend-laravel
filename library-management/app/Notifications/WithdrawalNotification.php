<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public float $amount,
        public string $status, // pending, approved, rejected, completed
        public ?string $notes = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Thông báo yêu cầu rút tiền')
            ->greeting('Xin chào ' . $notifiable->name . '!');

        switch ($this->status) {
            case 'pending':
                $mail->info()
                    ->line('Yêu cầu rút tiền **' . number_format($this->amount) . ' VND** đang chờ duyệt.')
                    ->line('Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.');
                break;
            case 'approved':
                $mail->success()
                    ->line('Yêu cầu rút tiền **' . number_format($this->amount) . ' VND** đã được duyệt.')
                    ->line('Tiền sẽ được chuyển vào tài khoản của bạn trong thời gian sớm nhất.');
                break;
            case 'rejected':
                $mail->error()
                    ->line('Yêu cầu rút tiền **' . number_format($this->amount) . ' VND** đã bị từ chối.')
                    ->line('Lý do: ' . ($this->notes ?? 'Không có'));
                break;
            case 'completed':
                $mail->success()
                    ->line('Yêu cầu rút tiền **' . number_format($this->amount) . ' VND** đã hoàn thành.')
                    ->line('Tiền đã được chuyển vào tài khoản của bạn.');
                break;
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'withdrawal',
            'amount' => $this->amount,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
