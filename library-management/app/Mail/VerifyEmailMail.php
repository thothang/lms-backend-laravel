<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;

class VerifyEmailMail extends Mailable
{
    public User $user;
    public string $verifyUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $verifyUrl)
    {
        $this->user = $user;
        $this->verifyUrl = $verifyUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS', 'library@example.com'), env('MAIL_FROM_NAME', 'Thư viện')),
            subject: 'Xác nhận Email đăng ký tài khoản Thư Viện',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Chào {$this->user->name},</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại Thư Viện của chúng tôi.</p>
                <p>Vui lòng click vào nút bên dưới để xác nhận email và kích hoạt tài khoản của bạn:</p>
                <p style='text-align: center; margin: 30px 0;'>
                    <a href='{$this->verifyUrl}' style='background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Xác nhận Email</a>
                </p>
                <p>Hoặc truy cập link sau: <br> <a href='{$this->verifyUrl}'>{$this->verifyUrl}</a></p>
                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                <hr style='margin-top: 30px; border: none; border-top: 1px solid #ccc;'>
                <p style='font-size: 12px; color: #888;'>Ban quản trị Thư Viện</p>
            </div>
            "
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
