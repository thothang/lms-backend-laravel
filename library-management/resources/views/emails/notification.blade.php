<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo - {{ config('app.name') }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .notification-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .notification-box h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 18px;
        }
        .notification-box p {
            color: #555;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        .library-info {
            background-color: #e7f3ff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            border: 1px solid #b8daff;
        }
        .library-info h3 {
            margin-top: 0;
            color: #004085;
            font-size: 16px;
        }
        .library-info p {
            margin: 5px 0;
            color: #004085;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
            <p>Thư viện số của bạn</p>
        </div>

        <div class="content">
            <div class="greeting">
                Kính gửi {{ $userName }},
            </div>

            <p>Bạn có một thông báo mới từ thư viện của chúng tôi. Vui lòng xem chi tiết bên dưới:</p>

            <div class="notification-box">
                <h3>📢 {{ $notificationTitle }}</h3>
                <p>{{ $notificationContent }}</p>
            </div>

            <div class="library-info">
                <h3>📚 Thông tin thư viện</h3>
                <p><strong>Tên thư viện:</strong> {{ config('app.name') }}</p>
                <p><strong>Địa chỉ:</strong> 123 Đường Thư Viện, Quận 1, TP.HCM</p>
                <p><strong>Điện thoại:</strong> (028) 1234-5678</p>
                <p><strong>Email:</strong> contact@library.com</p>
                <p><strong>Giờ mở cửa:</strong> Thứ 2 - Thứ 7: 8:00 - 20:00</p>
            </div>

            <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết thông báo và thực hiện các hành động cần thiết nếu có.</p>

            <p style="text-align: center;">
                <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}" class="button">Truy cập thư viện</a>
            </p>

            <p>Trân trọng,</p>
            <p><strong>Đội ngũ {{ config('app.name') }}</strong></p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời trực tiếp vào email này.</p>
        </div>
    </div>
</body>
</html>
