<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Library Settings
    |--------------------------------------------------------------------------
    |
    | Các cấu hình mặc định cho hệ thống quản lý thư viện
    |
    */

    // Phí mượn sách mặc định (VNĐ/ngày)
    'default_daily_fee' => env('DEFAULT_DAILY_FEE', 5000),

    // Phần trăm tiền cọc (so với giá sách)
    'deposit_percent' => env('DEPOSIT_PERCENT', 50),

    // Số tiền cọc tối đa (VNĐ)
    'max_deposit_amount' => env('MAX_DEPOSIT_AMOUNT', 300000),

    // Số sách tối đa được mượn cùng lúc
    'max_borrow_per_user' => env('MAX_BORROW_PER_USER', 3),

    // Số lần gia hạn tối đa
    'max_renew_count' => env('MAX_RENEW_COUNT', 2),

    // Số ngày mượn mặc định
    'default_borrow_days' => env('DEFAULT_BORROW_DAYS', 9),

    // Hệ số phạt quá hạn (nhân với daily_fee)
    'overdue_penalty_multiplier' => env('OVERDUE_PENALTY_MULTIPLIER', 1.5),

    // Số ngày giữa mỗi lần nhắc quá hạn
    'overdue_reminder_interval_days' => env('OVERDUE_REMINDER_INTERVAL_DAYS', 1),

    // Số lần nhắc tối đa
    'overdue_reminder_count' => env('OVERDUE_REMINDER_COUNT', 2),

    // Số ngày hạn trả nợ
    'debt_due_days' => env('DEBT_DUE_DAYS', 7),

    // Phí đặt trước (% của tổng phí mượn dự kiến)
    'reservation_fee_percent' => env('RESERVATION_FEE_PERCENT', 10),

    // Số ngày reservation có hiệu lực
    'reservation_expiry_days' => env('RESERVATION_EXPIRY_DAYS', 3),

    // Số ngày hiển thị tag "New"
    'new_book_days' => env('NEW_BOOK_DAYS', 30),

    // Ebook settings
    'ebook_author_revenue_percent' => env('EBOOK_AUTHOR_REVENUE_PERCENT', 60),

    // Rút tiền
    'min_withdrawal_amount' => env('MIN_WITHDRAWAL_AMOUNT', 100000),
    'author_withdrawal_threshold_percent' => env('AUTHOR_WITHDRAWAL_THRESHOLD_PERCENT', 70),

    // Ebook watermark text
    'ebook_watermark_format' => 'Doc boi: {name} ({email}) - Ngay: {date}',

    // Watermark settings (sử dụng FPDI cơ bản - không alpha)
    // Watermark in CHÉO từ góc trên bên trái xuống góc dưới bên phải
    'watermark' => [
        'enabled' => true,
        'position' => 'diagonal',
        'font_size' => 14,               // Tăng lên để dễ đọc hơn
        // Màu xám trung bình sáng - đủ nhìn trên nền trắng, không quá đậm che nội dung
        'color' => '#B0B0B0',
        'font' => 'helvetica',
    ],

    // Upload settings
    'max_ebook_size' => env('MAX_EBOOK_SIZE', 52428800), // 50MB
    'allowed_ebook_formats' => ['pdf'],

    // OCR settings
    'ocr_provider' => env('OCR_PROVIDER', 'fpt'), // fpt, google
    'fpt_api_key' => env('FPT_AI_API_KEY'),
    'google_vision_key' => env('GOOGLE_VISION_API_KEY'),

];
