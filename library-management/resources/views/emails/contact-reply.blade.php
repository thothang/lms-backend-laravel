<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trả lời thư liên hệ - {{ config('app.name') }}</title>
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
        .message-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .message-box h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 16px;
        }
        .original-message {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .original-message h4 {
            margin-top: 0;
            color: #856404;
            font-size: 14px;
        }
        .original-message p {
            margin: 10px 0;
            color: #856404;
            font-style: italic;
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

            <p>Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi đã nhận được thư của bạn và xin gửi lời cảm ơn chân thành vì sự quan tâm của bạn đối với thư viện của chúng tôi.</p>

            <div class="message-box">
                <h3>📨 Phản hồi từ thủ thư</h3>
                <p>{{ $replyMessage }}</p>
            </div>

            <div class="original-message">
                <h4>📝 Thư gốc của bạn:</h4>
                @if($originalSubject)
                    <p><strong>Chủ đề:</strong> {{ $originalSubject }}</p>
                @endif
                <p>{{ $originalMessage }}</p>
            </div>

            <div class="library-info">
                <h3>📚 Thông tin thư viện</h3>
                <p><strong>Tên thư viện:</strong> {{ config('app.name') }}</p>
                <p><strong>Địa chỉ:</strong> 123 Đường Thư Viện, Quận 1, TP.HCM</p>
                <p><strong>Điện thoại:</strong> (028) 1234-5678</p>
                <p><strong>Email:</strong> contact@library.com</p>
                <p><strong>Giờ mở cửa:</strong> Thứ 2 - Thứ 7: 8:00 - 20:00</p>
            </div>

            <p>Nếu bạn có thêm bất kỳ câu hỏi nào, vui lòng liên hệ lại với chúng tôi. Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>

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
