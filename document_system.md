HỆ THỐNG QUẢN LÝ THƯ VIỆN (LMS) – TÀI LIỆU THIẾT KẾ HOÀN CHỈNH
Phiên bản: 1.1
Ngày: 31/03/2026
Công nghệ: Laravel (Backend), MySQL, JWT, WebSocket (Laravel Reverb), Sepay

MỤC LỤC
Database Design

API Endpoints

Use Case Diagram

Activity Diagrams

Sequence Diagrams

ERD (Entity-Relationship Diagram)

Class Diagram

Phụ lục A: API Specification Chi Tiết

Phụ lục B: Logic Nghiệp Vụ Chi Tiết

Phụ lục C: Tích Hợp Sepay

Phụ lục D: WebSocket Events

Phụ lục E: Watermark

Phụ lục F: Background Jobs

Phụ lục G: Phân Quyền Chi Tiết

Phụ lục H: Audit Log và Soft Delete

1. DATABASE DESIGN
1.1 Danh sách các bảng
Bảng	Mô tả
users	Người dùng (admin, thủ thư, user, author)
user_debts	Khoản nợ của người dùng (phạt quá hạn, bồi thường)
role_permissions	Phân quyền chi tiết cho thủ thư
books	Đầu sách vật lý
book_copies	Các bản sao (barcode) của sách
book_categories	Thể loại sách
borrow_records	Phiếu mượn sách vật lý
reservations	Đặt trước sách
ebooks	Sách điện tử
ebook_purchases	Giao dịch mua ebook
reviews	Đánh giá (sách vật lý hoặc ebook)
transactions	Giao dịch thanh toán (ví nội bộ + Sepay)
withdrawal_requests	Yêu cầu rút tiền của author
notifications	Thông báo trong hệ thống
messages	Tin nhắn nội bộ (admin, thủ thư, author)
library_tickets	Vé thư viện vật lý (mua theo ngày)
settings	Cấu hình hệ thống
audit_logs	Nhật ký thay đổi quan trọng
1.2 Chi tiết các bảng
users
Trường	Kiểu	Mô tả
id	BIGINT PK	
name	VARCHAR(255)	
email	VARCHAR(255) UNIQUE	
password	VARCHAR(255)	
phone	VARCHAR(20)	
address	TEXT	
cccd_number	VARCHAR(255) UNIQUE (encrypted)	Không trả trực tiếp qua API
cccd_image	VARCHAR(255)	Lưu private storage, chỉ truy cập qua signed URL ngắn hạn
dob	DATE	
balance	DECIMAL(12,2) DEFAULT 0	Số dư ví chính
earnings_balance	DECIMAL(12,2) DEFAULT 0	Doanh thu từ bán ebook (chờ rút)
total_earned	DECIMAL(12,2) DEFAULT 0	Tổng doanh thu đã nhận (để tính ngưỡng duyệt)
total_debt	DECIMAL(12,2) DEFAULT 0	Tổng nợ hiện tại
status	ENUM('unverified','active','locked')	
role	ENUM('admin','librarian','user','author')	
last_withdrawal_at	DATETIME NULL	
deleted_at	TIMESTAMP NULL	Soft delete
timestamps		
user_debts
Trường	Kiểu	Mô tả
id	BIGINT PK	
user_id	BIGINT FK (users.id)	
amount	DECIMAL(12,2) NOT NULL	Số tiền nợ
paid_amount	DECIMAL(12,2) DEFAULT 0	Đã trả được bao nhiêu
reason	ENUM('overdue_penalty','lost_book_damage')	
borrow_record_id	BIGINT FK (borrow_records.id) NULL	
status	ENUM('pending','partial_paid','paid','written_off') DEFAULT 'pending'	
reminder_count	INT DEFAULT 0	Số lần đã nhắc
last_reminder_at	DATETIME NULL	
due_date	DATETIME NOT NULL	Hạn trả nợ (7 ngày kể từ khi phát sinh)
paid_at	DATETIME NULL	
created_at	TIMESTAMP	
updated_at	TIMESTAMP	
role_permissions
Trường	Kiểu	Mô tả
id	PK	
librarian_id	FK (users.id)	
can_approve_ebook	BOOLEAN	
can_manage_finance	BOOLEAN	
can_manage_users	BOOLEAN	
can_manage_books	BOOLEAN	
can_manage_borrow_offline	BOOLEAN	
can_manage_reservations	BOOLEAN	
can_mark_lost_books	BOOLEAN	
can_verify_cccd	BOOLEAN	
can_view_reports	BOOLEAN	
can_manage_hot_books	BOOLEAN	
can_manage_messages	BOOLEAN	
books
Trường	Kiểu	Mô tả
id	PK	
title	VARCHAR(255)	
author_name	VARCHAR(255)	
publisher	VARCHAR(255)	
category_id	FK (book_categories.id)	
description	TEXT	
price	DECIMAL(12,2)	Giá trị sách (tính cọc)
daily_fee	DECIMAL(12,2) NULL	Phí mượn/ngày riêng
is_hot	BOOLEAN	
is_featured	BOOLEAN	
in_carousel	BOOLEAN	
carousel_order	INT	
total_copies	INT	
available_copies	INT	
deleted_at	TIMESTAMP NULL	
book_copies
Trường	Kiểu	Mô tả
id	PK	
book_id	FK (books.id)	
barcode	VARCHAR(50) UNIQUE	
status	ENUM('available','borrowed','lost','damaged')	
deleted_at	TIMESTAMP NULL	
borrow_records
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id) NULL	NULL cho khách vãng lai
guest_name	VARCHAR(255) NULL	
guest_phone	VARCHAR(20) NULL	
guest_cccd	VARCHAR(20) NULL	
copy_id	FK (book_copies.id)	
borrow_date	DATE	
due_date	DATE	
return_date	DATE NULL	
daily_fee_applied	DECIMAL(12,2)	
deposit_amount	DECIMAL(12,2)	
renew_count	INT DEFAULT 0	Số lần đã gia hạn (tối đa 2)
status	ENUM('active','returned','overdue','lost','pending_return')	
reservations
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
book_id	FK (books.id)	
copy_id	FK (book_copies.id) NULL	
expected_borrow_days	INT DEFAULT 9	Số ngày dự kiến mượn (1-9)
reservation_date	DATETIME	
expiry_date	DATETIME	
fee_paid	DECIMAL(12,2)	10% tổng phí mượn dự kiến
status	ENUM('pending','fulfilled','expired','cancelled')	
queue_order	INT	Thứ tự trong hàng đợi
ebooks
Trường	Kiểu	Mô tả
id	PK	
title	VARCHAR(255)	
author_id	FK (users.id)	
description	TEXT	
price	DECIMAL(12,2)	
file_path	VARCHAR(255)	
free_preview_pages	INT DEFAULT 0	
status	ENUM('pending','approved','rejected')	
rejection_reason	TEXT NULL	
is_free	BOOLEAN	
deleted_at	TIMESTAMP NULL	
ebook_purchases
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
ebook_id	FK (ebooks.id)	
purchase_date	DATETIME	
amount	DECIMAL(12,2)	
reviews
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
book_id	FK (books.id) NULL	
ebook_id	FK (ebooks.id) NULL	
rating	TINYINT (1-5)	
comment	TEXT	
created_at		
CHECK	(book_id IS NOT NULL XOR ebook_id IS NOT NULL)	
UNIQUE	(user_id, book_id)	Chỉ áp dụng khi book_id IS NOT NULL
UNIQUE	(user_id, ebook_id)	Chỉ áp dụng khi ebook_id IS NOT NULL
transactions
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
amount	DECIMAL(12,2)	
type	ENUM('deposit','borrow_fee','penalty','ebook_purchase','library_ticket','withdrawal','deposit_hold','deposit_refund')	
status	ENUM('pending','success','failed')	
payment_gateway	VARCHAR(50) DEFAULT 'Sepay'	
gateway_transaction_id	VARCHAR(255) NULL	
metadata	JSON	
withdrawal_requests
Trường	Kiểu	Mô tả
id	PK	
author_id	FK (users.id)	
amount	DECIMAL(12,2)	
bank_account_info	JSON	
status	ENUM('pending','approved','rejected','completed')	
admin_notes	TEXT	
notifications
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
title	VARCHAR(255)	
content	TEXT	
type	ENUM('email','web','push')	
is_read	BOOLEAN DEFAULT FALSE	
messages
Trường	Kiểu	Mô tả
id	PK	
from_user_id	FK (users.id)	
to_user_id	FK (users.id)	
message	TEXT	
is_read	BOOLEAN DEFAULT FALSE	
deleted_at	TIMESTAMP NULL	
library_tickets
Trường	Kiểu	Mô tả
id	PK	
user_id	FK (users.id)	
purchase_date	DATE	
valid_from	DATE	
valid_to	DATE	
amount	DECIMAL(12,2)	
settings
Trường	Kiểu	Mô tả
key	VARCHAR(255) PK	
value	TEXT	
updated_at	TIMESTAMP	
audit_logs
Trường	Kiểu	Mô tả
id	BIGINT PK	
user_id	BIGINT FK (users.id)	
action	VARCHAR(100)	
table_name	VARCHAR(100)	
record_id	BIGINT	
old_values	JSON	
new_values	JSON	
ip_address	VARCHAR(45)	
user_agent	TEXT	
created_at	TIMESTAMP	
1.2.1 Constraints và Index quan trọng
- borrow_records: INDEX(user_id), INDEX(status), INDEX(due_date), INDEX(created_at)
- reservations: INDEX(user_id), INDEX(book_id), INDEX(status), INDEX(created_at)
- reviews: UNIQUE(user_id, book_id), UNIQUE(user_id, ebook_id)
- Tất cả FK nên có index tương ứng để tránh full scan khi join.

1.3 Quan hệ (ERD)
users 1‑n borrow_records, reservations, ebook_purchases, reviews, transactions, notifications, library_tickets, withdrawal_requests, user_debts, audit_logs

users (sender) 1‑n messages (from_user_id)

users (receiver) 1‑n messages (to_user_id)

users (author) 1‑n ebooks

books 1‑n book_copies, reservations, reviews

ebooks 1‑n ebook_purchases, reviews

book_categories 1‑n books

borrow_records 1‑n user_debts

2. API ENDPOINTS
2.1 Công khai (không cần JWT)
Method	Endpoint	Mô tả
GET	/api/books	Danh sách sách vật lý (filter)
GET	/api/books/{id}	Chi tiết sách + reviews
GET	/api/books/hot	Sách hot
GET	/api/books/featured	Sách nổi bật
GET	/api/books/carousel	Sách carousel
GET	/api/ebooks	Danh sách ebook (metadata)
GET	/api/ebooks/{id}	Chi tiết ebook
GET	/api/categories	Danh sách thể loại sách
POST	/api/register	Đăng ký (upload CCCD, hỗ trợ nhập tay)
POST	/api/login	Đăng nhập → JWT
POST	/api/forgot-password	Gửi email reset mật khẩu
POST	/api/reset-password	Đặt lại mật khẩu
2.2 Yêu cầu JWT (mọi user đã đăng nhập)
Method	Endpoint	Mô tả
POST	/api/refresh-token	Làm mới JWT
GET	/api/profile	Thông tin cá nhân
PUT	/api/profile	Cập nhật profile
POST	/api/change-password	Đổi mật khẩu
GET	/api/my-borrows	Lịch sử mượn sách
GET	/api/my-ebooks	Sách đã mua
GET	/api/my-reservations	Đặt trước
GET	/api/balance	Số dư ví
POST	/api/deposit	Nạp tiền (Sepay)
POST	/api/sepay-callback	Webhook Sepay
POST	/api/borrow/{copy_id}	Mượn sách
POST	/api/return/{borrow_id}	Trả sách
POST	/api/renew/{borrow_id}	Gia hạn
POST	/api/reserve/{book_id}	Đặt trước (kèm expected_days)
DELETE	/api/reservation/{id}	Hủy đặt trước
POST	/api/ebooks/{id}/purchase	Mua ebook
GET	/api/ebooks/{id}/read	Đọc ebook (watermark)
POST	/api/reviews/book/{book_id}	Đánh giá sách vật lý
POST	/api/reviews/ebook/{ebook_id}	Đánh giá ebook
POST	/api/buy-library-ticket	Mua vé thư viện
GET	/api/notifications	Lấy thông báo
PUT	/api/notifications/{id}/read	Đánh dấu đã đọc
GET	/api/messages	Danh sách tin nhắn
POST	/api/messages	Gửi tin nhắn
PUT	/api/messages/{id}/read	Đánh dấu đã đọc tin nhắn
2.3 Dành cho Author
Method	Endpoint	Mô tả
POST	/api/author/ebooks	Upload ebook (pending)
GET	/api/author/ebooks	DS ebook của mình
PUT	/api/author/ebooks/{id}	Cập nhật metadata
GET	/api/author/earnings	Doanh thu
POST	/api/author/withdraw	Yêu cầu rút tiền
2.4 Dành cho Thủ thư (Librarian)
Method	Endpoint	Mô tả
POST	/api/librarian/books	Tạo đầu sách
PUT	/api/librarian/books/{id}	Sửa sách
DELETE	/api/librarian/books/{id}	Xóa sách (soft delete)
POST	/api/librarian/books/{id}/copies	Thêm bản copy
DELETE	/api/librarian/copies/{id}	Xóa bản copy
POST	/api/librarian/borrow/offline	Mượn cho khách vãng lai
POST	/api/librarian/return/{borrow_id}	Nhận trả
GET	/api/librarian/reservations	DS đặt trước
POST	/api/librarian/reservations/{id}/confirm	Xác nhận lấy sách
POST	/api/librarian/books/{copy_id}/mark-lost	Mất/hư
PUT	/api/librarian/users/{id}/verify-cccd	Duyệt CCCD
POST	/api/librarian/settings/books/hot	Gắn hot/featured/carousel
2.5 Dành cho Admin (kế thừa thủ thư, thêm)
Method	Endpoint	Mô tả
GET	/api/admin/users	DS user
PUT	/api/admin/users/{id}/status	Khóa/mở khóa
POST	/api/admin/users/{id}/make-author	Duyệt author (chuyển role)
GET	/api/admin/permissions/librarians	Phân quyền thủ thư
PUT	/api/admin/permissions/librarian/{id}	Cập nhật quyền
GET	/api/admin/ebooks/pending	Ebook chờ duyệt
POST	/api/admin/ebooks/{id}/approve	Duyệt ebook
POST	/api/admin/ebooks/{id}/reject	Từ chối
GET	/api/admin/withdraw-requests	Yêu cầu rút tiền
POST	/api/admin/withdraw-requests/{id}/process	Xử lý
GET	/api/admin/settings	Cấu hình
PUT	/api/admin/settings	Cập nhật cấu hình
GET	/api/admin/reports/*	Các báo cáo
GET	/api/admin/audit-logs	Xem nhật ký hệ thống
3. USE CASE DIAGRAM (mô tả bằng văn bản)
3.1 Actors
Khách vãng lai (Guest)

User (bạn đọc đã đăng nhập)

Author (kế thừa User)

Thủ thư (Librarian)

Admin

3.2 Use Cases theo actor
Khách vãng lai

Tra cứu sách (vật lý & ebook metadata)

Xem chi tiết sách, đánh giá

Đăng ký tài khoản (xác thực email)

Quên mật khẩu

User

Đăng nhập, quản lý profile

Nạp tiền vào ví (qua Sepay)

Mượn sách vật lý (kiểm tra trùng, reservation)

Trả sách (tự động tính phí, hoàn cọc)

Gia hạn sách (tối đa 2 lần)

Đặt trước sách (kèm số ngày mượn dự kiến)

Mua ebook

Đọc ebook (có watermark)

Đánh giá sách

Mua vé thư viện

Xem lịch sử mượn, sách đã mua, số dư

Gửi tin nhắn nội bộ (đến admin/thủ thư/author)

Xem và thanh toán nợ (nếu có)

Author

Upload ebook

Quản lý ebook của mình

Xem doanh thu

Yêu cầu rút tiền (kiểm tra ngưỡng 70%)

Nhận thông báo realtime khi ebook được duyệt/từ chối

Thủ thư

Quản lý đầu sách, bản copy

Tạo phiếu mượn/trả tại quầy (kể cả cho khách vãng lai)

Quản lý reservation (xác nhận, hủy)

Ghi nhận sách mất/hư (tạo khoản nợ)

Duyệt CCCD

Xem báo cáo

Gắn tag hot/featured/carousel

(Nếu được ủy quyền) Duyệt ebook

Admin

Toàn bộ quyền thủ thư

Phân quyền cho thủ thư

Duyệt author (chuyển role)

Duyệt ebook (hoặc ủy quyền)

Xử lý rút tiền (khi >70%)

Cấu hình hệ thống (tham số động)

Xem tất cả báo cáo doanh thu

Xem audit logs

4. ACTIVITY DIAGRAMS
4.1 Mượn sách vật lý (online)
[User] → Chọn sách có available_copy → Nhấn "Mượn"

Hệ thống kiểm tra:

Tài khoản active?

total_debt == 0?

Chưa mượn quá max_borrow_per_user cuốn?

Đủ tiền cọc (min(price * deposit_percent/100, max_deposit_amount))?

Sách còn bản copy?

User chưa mượn sách cùng book_id (đang có borrow_record active/overdue)?

Kiểm tra reservation: Nếu có reservation pending cho đầu sách này và user hiện tại không phải là người đặt trước đầu tiên trong hàng đợi → từ chối, thông báo "Sách đã có người đặt trước"

Thực thi trong DB transaction + row lock để tránh race condition:
SELECT * FROM book_copies
WHERE id = ? AND status = 'available'
FOR UPDATE;

Nếu OK:

Tạo borrow_record, status = active

Giữ tiền cọc từ ví (ghi transaction type = 'deposit_hold')

Giảm available_copies, cập nhật copy status = borrowed

Gửi thông báo (email + web + WebSocket)

Kết thúc. Nếu không đủ điều kiện → thông báo lỗi.

4.2 Trả sách
[User/Librarian] → Chọn phiếu mượn → Nhấn "Trả sách"

Hệ thống tính:

total_days_borrowed = ngày trả - ngày mượn

overdue_days = max(0, ngày trả - due_date)

borrow_fee = (total_days_borrowed - overdue_days) * daily_fee_applied

So sánh borrow_fee với tiền cọc:

Nếu borrow_fee <= deposit_amount:
→ hoàn lại deposit_amount - borrow_fee vào ví user (transaction type = 'deposit_refund')
→ cập nhật borrow_record status = 'returned', return_date = today
→ tăng available_copies, copy status = 'available'
→ nếu có reservation pending: lock + chọn queue_order nhỏ nhất để chuyển 'fulfilled' và gửi notify

Nếu borrow_fee > deposit_amount:
→ tạo transaction yêu cầu thanh toán phần thiếu (type = 'borrow_fee', status = 'pending')
→ chuyển borrow_record sang status = 'pending_return'
→ KHÔNG cập nhật returned
→ KHÔNG trả copy về available
→ gửi payment_url cho user, chờ callback từ Sepay

Khi Sepay callback thành công cho phần thiếu:
→ cập nhật borrow_record status = 'returned', return_date = today
→ tăng available_copies, copy status = 'available'
→ xử lý queue reservation theo thứ tự với lock chống concurrency

SQL mẫu khi assign reservation (concurrency-safe):
UPDATE reservations
SET status = 'fulfilled'
WHERE id = (
   SELECT id FROM reservations
   WHERE book_id = ?
   AND status = 'pending'
   ORDER BY queue_order
   LIMIT 1
   FOR UPDATE
);

Kết thúc.

4.3 Upload và duyệt ebook
[Author] → Đăng nhập → Vào trang quản lý ebook → Upload file + metadata

Hệ thống kiểm tra dung lượng, định dạng → lưu file tạm, tạo bản ghi ebook với status = 'pending'

Gửi thông báo cho admin (và thủ thư nếu được ủy quyền) qua WebSocket

[Admin/Thủ thư] → Xem danh sách pending → Chọn duyệt hoặc từ chối

Nếu duyệt: status = 'approved', ebook có thể bán, gửi event EbookStatusChanged (approved)

Nếu từ chối: nhập lý do, status = 'rejected', gửi event kèm rejection_reason

[Author] → Nhận thông báo, nếu bị từ chối có thể sửa và upload lại.

5. SEQUENCE DIAGRAMS
5.1 Mượn sách
text
Copy
Download
User -> Frontend: POST /api/borrow/{copy_id}
Frontend -> Backend: borrow(copy_id)
Backend -> Auth: lấy user từ JWT
Backend -> BorrowService: checkBorrowEligibility(user, copy)
BorrowService -> UserModel: get balance, current borrow count, check active
BorrowService -> BookCopyModel: get book details, daily_fee, price
BorrowService -> BorrowRecordModel: kiểm tra user đã mượn đầu sách cùng book_id chưa

alt Nếu đã mượn
    Backend -> Frontend: 422 "Bạn đang mượn sách này"
BorrowService -> ReservationModel: kiểm tra reservation pending cho book
alt Có reservation và user không phải đầu hàng đợi
    Backend -> Frontend: 422 "Sách đã có người đặt trước"
alt Đủ điều kiện
    BorrowService -> DB: bắt đầu transaction + SELECT ... FOR UPDATE book_copies
    BorrowService -> TransactionModel: giữ cọc (type=deposit_hold)
    BorrowService -> BorrowRecordModel: tạo record (status=active)
    BorrowService -> BookCopyModel: update status=borrowed
    BorrowService -> NotificationService: send notification + WebSocket
    BorrowService -> DB: commit
    Backend -> Frontend: 200 OK

5.2 Thanh toán qua Sepay (nạp tiền)
text
Copy
Download
User -> Frontend: POST /api/deposit (amount)
Frontend -> Backend: deposit(amount)
Backend -> TransactionModel: create transaction (status=pending, type=deposit)
Backend -> SepayGateway: call createPayment(amount, callback_url)
SepayGateway -> Sepay: HTTP request
Sepay -> Backend: return payment_url
Backend -> Frontend: trả về payment_url
Frontend -> User: redirect đến Sepay
User -> Sepay: thực hiện thanh toán
Sepay -> Backend: POST /api/sepay-callback (webhook)
Backend -> SepayController: xác minh signature, cập nhật transaction
Backend -> UserModel: increase balance by amount
Backend -> NotificationService: gửi thông báo nạp tiền thành công

6. ERD (Entity-Relationship Diagram) – mô tả
Các thực thể và quan hệ chính:

users (1) ----< (n) borrow_records

users (1) ----< (n) reservations

users (1) ----< (n) ebook_purchases

users (1) ----< (n) reviews

users (1) ----< (n) transactions

users (1) ----< (n) notifications

users (1) (as sender) ----< (n) messages (from_user_id)

users (1) (as receiver) ----< (n) messages (to_user_id)

users (1) (as author) ----< (n) ebooks

users (1) ----< (n) library_tickets

users (1) ----< (n) withdrawal_requests

users (1) ----< (n) user_debts

users (1) ----< (n) audit_logs

books (1) ----< (n) book_copies

books (1) ----< (n) reservations

books (1) ----< (n) reviews

ebooks (1) ----< (n) ebook_purchases

ebooks (1) ----< (n) reviews

book_categories (1) ----< (n) books

borrow_records (1) ----< (n) user_debts

Lưu ý: borrow_records liên kết với book_copies qua copy_id, không trực tiếp với books.

7. CLASS DIAGRAM (các lớp chính trong Laravel)
7.1 Model classes

Nguyên tắc: Model chỉ giữ data + relationship, business logic đặt trong Service.

class User extends Authenticatable {
    use SoftDeletes;
    
    public function borrowRecords() { return $this->hasMany(BorrowRecord::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
    public function ebookPurchases() { return $this->hasMany(EbookPurchase::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function transactions() { return $this->hasMany(Transaction::class); }
    public function notifications() { return $this->hasMany(Notification::class); }
    public function sentMessages() { return $this->hasMany(Message::class, 'from_user_id'); }
    public function receivedMessages() { return $this->hasMany(Message::class, 'to_user_id'); }
    public function ebooks() { return $this->hasMany(Ebook::class, 'author_id'); }
    public function libraryTickets() { return $this->hasMany(LibraryTicket::class); }
    public function withdrawalRequests() { return $this->hasMany(WithdrawalRequest::class, 'author_id'); }
    public function debts() { return $this->hasMany(UserDebt::class); }
    public function auditLogs() { return $this->hasMany(AuditLog::class); }
}

class UserDebt extends Model {
    public function user() { return $this->belongsTo(User::class); }
    public function borrowRecord() { return $this->belongsTo(BorrowRecord::class); }
}

class Book extends Model {
    use SoftDeletes;
    public function copies() { return $this->hasMany(BookCopy::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
    public function category() { return $this->belongsTo(BookCategory::class); }
}

class BookCopy extends Model {
    public function book() { return $this->belongsTo(Book::class); }
    public function borrowRecord() { return $this->hasOne(BorrowRecord::class); }
}

class BorrowRecord extends Model {
    public function user() { return $this->belongsTo(User::class); }
    public function copy() { return $this->belongsTo(BookCopy::class); }
    public function debts() { return $this->hasMany(UserDebt::class); }
}

class Ebook extends Model {
    use SoftDeletes;
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
    public function purchases() { return $this->hasMany(EbookPurchase::class); }
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
}

class Transaction extends Model {
    public function user() { return $this->belongsTo(User::class); }
    public function markSuccess() { /* ... */ }
}

class SepayGateway {
    public function createPayment($amount, $callbackUrl, $orderId) { /* ... */ }
    public function verifySignature($payload, $signature) { /* ... */ }
    public function checkTransactionStatus($transactionId) { /* ... */ }
}

class AuditLog extends Model {
    protected $casts = ['old_values' => 'array', 'new_values' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
}

7.2 Controller classes
AuthController – register, login, profile, updateProfile, forgotPassword, resetPassword, refreshToken

BookController – index, show, getHot, getFeatured, getCarousel, categories

BorrowController – borrow, returnBook, renew, reserve, cancelReservation

EbookController – index, show, purchase, read

AuthorEbookController – store, index, update, earnings, withdraw

BookManagementController – CRUD đầu sách, bản copy, hot/featured/carousel

BorrowManagementController – xử lý mượn/trả/gia hạn tại quầy

ReservationController – quản lý queue reservation, confirm/hủy

UserManagementController – duyệt CCCD, khóa/mở user theo quyền

AdminEbookController – duyệt/từ chối ebook

AdminFinanceController – xử lý rút tiền, cấu hình tài chính

AdminPermissionController – phân quyền thủ thư

AdminAuditController – xem audit logs

PaymentController – deposit, sepayCallback

NotificationController – index, markAsRead

MessageController – index, store, markAsRead

ReportController – các báo cáo

SettingController – quản lý cấu hình

7.3 Service classes
BorrowService – logic mượn/trả, tính phí, xử lý nợ

PaymentService – xử lý giao dịch, tích hợp Sepay

ReservationService – assign queue theo thứ tự, lock concurrency

UserService – kiểm tra eligibility (debt/quota), cập nhật số dư an toàn

EbookWatermarkService – thêm watermark vào file PDF

// OCRService removed

NotificationService – gửi email, web notification, realtime qua WebSocket

8. PHỤ LỤC A: API SPECIFICATION CHI TIẾT
A.1 Quy ước chung
Base URL: https://api.thuvien.com/api

Authentication: JWT trong header Authorization: Bearer <token>

Content-Type: application/json

Mã lỗi HTTP:

200 – Thành công

201 – Tạo thành công

400 – Yêu cầu sai

401 – Chưa xác thực

403 – Không có quyền

422 – Validation lỗi (kèm chi tiết)

500 – Lỗi server

A.2 Endpoint đăng ký
POST /register

Request body:

json
Copy
Download
{
  "email": "user@example.com",
  "password": "12345678",
  "password_confirmation": "12345678",
  "name": "Nguyễn Văn A",
  "phone": "0987654321",
  "address": "Hà Nội",
  "cccd_image": "base64_string_or_url",
  "cccd_number": "0123456789",
  "dob": "1990-01-01",

}

Response (201):

json
Copy
Download
{
  "message": "Đăng ký thành công. Chờ duyệt CCCD.",
  "user_id": 123,
  "status": "unverified"
}

A.3 Endpoint đăng nhập
POST /login

Request:

json
Copy
Download
{
  "email": "user@example.com",
  "password": "12345678"
}

Response (200):

json
Copy
Download
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "balance": 150000
  }
}

A.4 Endpoint đặt trước sách
POST /reserve/{book_id}

Request body:

json
Copy
Download
{
  "expected_borrow_days": 5   // từ 1 đến 9, mặc định 9
}

Response (200):

json
Copy
Download
{
  "message": "Đặt trước thành công, phí giữ chỗ 10% đã trừ",
  "reservation_id": 123,
  "fee_paid": 2500,
  "queue_position": 2
}

Validation lỗi (422): "Bạn đang mượn sách này" / "Bạn đã có reservation pending cho sách này"

A.5 Endpoint mượn sách
POST /borrow/{copy_id}

Headers: Authorization: Bearer <token>

Response (200):

json
Copy
Download
{
  "message": "Mượn sách thành công",
  "borrow_record": {
    "id": 567,
    "copy_id": 123,
    "book_title": "Lập trình Laravel",
    "borrow_date": "2026-03-30",
    "due_date": "2026-04-08",
    "daily_fee": 5000,
    "deposit_amount": 25000,
    "status": "active"
  }
}
Các lỗi có thể:

401 – Chưa đăng nhập

403 – Tài khoản bị khóa hoặc chưa xác thực

422 – Không đủ điều kiện (kèm message: "Đã mượn đủ 3 cuốn", "Không đủ tiền cọc", "Sách không còn bản", "Bạn đang mượn đầu sách này rồi", "Sách đã có người đặt trước", "Bạn đang có nợ chưa thanh toán")

A.6 Endpoint trả sách
POST /return/{borrow_id}

Response khi đủ cọc (200):

json
Copy
Download
{
  "message": "Trả sách thành công",
  "borrow_fee": 15000,
  "deposit": 25000,
  "refund": 10000
}
Response khi thiếu tiền (200):

json
Copy
Download
{
  "message": "Phí mượn vượt quá tiền cọc, vui lòng thanh toán phần còn lại",
  "borrow_fee": 35000,
  "deposit": 25000,
  "extra_amount_needed": 10000,
  "payment_url": "https://sepay.com/pay/xyz",
  "borrow_record_status": "pending_return"
}
A.7 Endpoint tìm kiếm sách
GET /books?keyword=laravel&category=1&author=Nguyễn&sort=title&page=1&limit=20

Query params:

keyword – tìm theo title, author, publisher

category_id – lọc theo thể loại

author – lọc theo tác giả

status – available (chỉ hiện còn bản), all (mặc định)

sort – title, created_at, popular

page, limit

Response (200):

json
Copy
Download
{
  "data": [
    {
      "id": 1,
      "title": "Laravel 11",
      "author_name": "Taylor Otwell",
      "publisher": "O'Reilly",
      "category": "Lập trình",
      "available_copies": 3,
      "total_copies": 5,
      "daily_fee": 5000,
      "is_hot": true,
      "average_rating": 4.5
    }
  ],
  "meta": { "current_page": 1, "last_page": 5, "total": 95 }
}
A.8 Endpoint đánh giá sách
POST /reviews/book/{book_id}

Request body:

json
Copy
Download
{
  "rating": 5,
  "comment": "Sách rất hay, hữu ích!"
}
Response (201):

json
Copy
Download
{
  "message": "Đánh giá thành công",
  "review": {
    "id": 999,
    "user_id": 123,
    "rating": 5,
    "comment": "Sách rất hay, hữu ích!",
    "created_at": "2026-03-30T10:00:00Z"
  }
}
Lỗi (422): "Bạn chưa mượn hoặc mua sách này" / "Bạn đã đánh giá rồi"

A.9 Endpoint nạp tiền qua Sepay
POST /deposit

Request body:

json
Copy
Download
{
  "amount": 100000
}
Response (200):

json
Copy
Download
{
  "transaction_id": 888,
  "payment_url": "https://sepay.com/pay/xyz",
  "message": "Chuyển hướng đến Sepay để thanh toán"
}
POST /sepay-callback (webhook, không cần JWT) – Sepay gửi về:

json
Copy
Download
{
  "transaction_id": "sepay_123456",
  "status": "success",
  "amount": 100000,
  "signature": "md5_hash"
}
A.10 Endpoint upload ebook (author)
POST /author/ebooks (multipart/form-data)

Body:

title (string)

description (text)

price (decimal)

is_free (boolean, default false)

file (file: pdf, max 50MB)

Response (201):

json
Copy
Download
{
  "message": "Ebook đã được gửi đi duyệt",
  "ebook_id": 456,
  "status": "pending"
}
A.11 Endpoint đọc ebook (stream)
GET /ebooks/{id}/read?page=5

Response: Stream file PDF với watermark được chèn động.
Header: Content-Type: application/pdf
Watermark hiển thị ở góc dưới bên phải mỗi trang:
*"Đọc bởi: Nguyễn Văn A (user@example.com) - Ngày: 30/03/2026"*

Lỗi (403): Chưa mua hoặc chưa đăng nhập (đối với ebook free yêu cầu đăng nhập).

A.12 Endpoint quên mật khẩu
POST /api/forgot-password
Request: { "email": "user@example.com" }
Response: { "message": "Link đặt lại mật khẩu đã được gửi đến email của bạn" }

POST /api/reset-password
Request: { "email": "...", "token": "...", "password": "...", "password_confirmation": "..." }
Response: { "message": "Mật khẩu đã được đặt lại" }

A.13 Endpoint làm mới token
POST /api/refresh-token (cần JWT hiện tại)
Response:

json
Copy
Download
{
  "access_token": "new_token...",
  "token_type": "bearer",
  "expires_in": 3600
}
9. PHỤ LỤC B: LOGIC NGHIỆP VỤ CHI TIẾT
B.1 Công thức tính phí mượn và cọc

$defaultDailyFee = getSetting('default_daily_fee'); // 5000
$dailyFee = $book->daily_fee ?? $defaultDailyFee;

$depositPercent = getSetting('deposit_percent'); // 50
$maxDeposit = getSetting('max_deposit_amount');  // 300000
$deposit = min($book->price * $depositPercent / 100, $maxDeposit);

// Phí đặt trước = 10% * ($dailyFee * expected_borrow_days)
$reservationFee = 0.1 * ($dailyFee * $expectedDays);
B.2 Gia hạn sách
Điều kiện: sách chưa quá hạn, chưa có người đặt trước, renew_count < max_renew_count (mặc định 2)

Số ngày gia hạn tối đa: 9 ngày

Phí gia hạn = số ngày gia hạn * daily_fee, thanh toán ngay từ ví

Cập nhật due_date mới, tăng renew_count

B.3 Xử lý quá hạn (overdue)
Background job chạy mỗi ngày lúc 00:00:

Tìm các borrow_records có due_date < now() và status = 'active'

Đánh dấu status = 'overdue'

Tính phí phạt mỗi ngày = daily_fee * overdue_penalty_multiplier (mặc định 1.5)

Nếu user có đủ số dư, trừ từ ví, ghi transaction type='penalty'

Nếu không đủ, tạo bản ghi trong user_debts, cập nhật total_debt của user

Gửi thông báo mỗi ngày theo overdue_reminder_interval_days, tối đa overdue_reminder_count lần

Sau 2 lần nhắc mà không trả sách và không thanh toán nợ → khóa tài khoản

B.4 Xử lý sách mất/hư
Thủ thư gọi POST /librarian/books/{copy_id}/mark-lost

Tính phí bồi thường = book->price * 1.0 (100%)

Nếu user có đủ số dư, trừ từ ví

Nếu không đủ, tạo khoản nợ trong user_debts

Cập nhật book_copies.status = 'lost', giảm available_copies

Cập nhật borrow_record.status = 'lost'

B.5 Chia doanh thu ebook
Khi user mua ebook thành công: 60% số tiền cộng vào earnings_balance của author, 40% vào doanh thu thư viện

Author rút tiền:

Yêu cầu tối thiểu: min_withdrawal_amount (mặc định 100,000 VNĐ)

Nếu số tiền rút > author_withdrawal_threshold_percent% (mặc định 70%) tổng total_earned hiện tại → cần admin duyệt

Admin duyệt → gọi chuyển khoản thực tế, sau đó trừ earnings_balance

B.6 Xử lý reservation hết hạn
Background job chạy mỗi giờ, tìm reservations có expiry_date < now() và status = 'pending'

Cập nhật status = 'expired'

Không hoàn lại 10% phí đặt trước (coi như phí giữ chỗ)

10. PHỤ LỤC C: TÍCH HỢP Sepay
C.1 Tạo thanh toán
http
Copy
Download
POST https://sandbox.sepay.com/api/v1/payment
Headers: Authorization: Bearer <Sepay_api_key>
Body:
{
  "amount": 100000,
  "currency": "VND",
  "order_id": "LMS_888",
  "callback_url": "https://api.thuvien.com/api/sepay-callback",
  "return_url": "https://frontend.thuvien.com/payment-result"
}
Response:

json
Copy
Download
{
  "payment_url": "https://sandbox.sepay.com/pay/abc123",
  "transaction_id": "sepay_XYZ"
}
C.2 Webhook callback – Kiểm tra chữ ký

public function handleCallback(Request $request)
{
    $payload = $request->all();
    $signature = $payload['signature'];
    unset($payload['signature']);
    
    $expected = md5(json_encode($payload) . config('sepay.secret_key'));
    if (!hash_equals($expected, $signature)) {
        Log::warning('Invalid Sepay signature', $payload);
        return response()->json(['error' => 'Invalid signature'], 403);
    }
    
    $transaction = Transaction::where('gateway_transaction_id', $payload['transaction_id'])->lockForUpdate()->first();
    if (!$transaction) {
        return response()->json(['error' => 'Transaction not found'], 404);
    }

    if ($transaction->status === 'success') {
        return response()->json(['status' => 'ok']); // idempotency: đã xử lý trước đó
    }

    if ($payload['status'] == 'success') {
        $transaction->update(['status' => 'success']);
        if ($transaction->type == 'deposit') {
            $transaction->user->addBalance($transaction->amount);
        } elseif ($transaction->type == 'borrow_fee') {
            $borrowRecord = BorrowRecord::where('id', $transaction->metadata['borrow_id'])->first();
            // hoàn tất trả sách trong BorrowService để đảm bảo update status/copy atomically
            app(BorrowService::class)->finalizePendingReturn($borrowRecord);
        }
    }
    return response()->json(['status' => 'ok']);
}
C.3 Xử lý timeout & retry
Nếu không nhận được callback sau 15 phút, hệ thống tự động gọi API kiểm tra trạng thái từ Sepay

Retry tối đa 3 lần, mỗi lần cách 5 phút

Sau 3 lần thất bại, đánh dấu transaction failed, thông báo user thử lại

11. PHỤ LỤC D: WEBSOCKET EVENTS (LARAVEL REVERB)
D.1 Kênh
private-user.{user_id} – mỗi user nhận thông báo riêng

D.2 Các event
Event name	Payload	Khi nào gửi
App\Events\NotificationSent	{ notification_id, title, content, type }	Có thông báo mới
App\Events\BorrowStatusChanged	{ borrow_id, status, message }	Mượn/trả/gia hạn thành công
App\Events\ReservationExpired	{ reservation_id, book_title }	Reservation hết hạn
App\Events\NewMessage	{ message_id, from_user, content }	Có tin nhắn mới
App\Events\EbookStatusChanged	{ ebook_id, status, rejection_reason }	Ebook được duyệt/từ chối
D.3 Xác thực WebSocket
Sử dụng token JWT trong connection param:

javascript
Copy
Download
Echo.connector('reverb', {
    key: 'app-key',
    wsHost: 'ws.thuvien.com',
    wsPort: 8080,
    authEndpoint: '/api/broadcasting/auth',
    auth: {
        headers: { Authorization: 'Bearer ' + token }
    }
});
12. PHỤ LỤC E: WATERMARK
E.1 Watermark ebook (hỗ trợ PDF)
Yêu cầu author upload file PDF (EPUB có thể chuyển đổi sau)

Sử dụng thư viện setasign/fpdi + setasign/fpdf

use setasign\Fpdi\Fpdi;

$pdf = new Fpdi();
$pageCount = $pdf->setSourceFile($originalFile);
for ($i = 1; $i <= $pageCount; $i++) {
    $pdf->AddPage();
    $tplIdx = $pdf->importPage($i);
    $pdf->useTemplate($tplIdx);
    $pdf->SetFont('helvetica', 'I', 8);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->SetXY(10, $pdf->GetPageHeight() - 10);
    $pdf->Cell(0, 10, "Đọc bởi: {$user->name} ({$user->email}) - Ngày: " . date('Y-m-d'), 0, 0, 'R');
}
$pdf->Output('I', 'ebook_watermarked.pdf');

Lưu ý bảo mật bắt buộc (watermark không đủ để chống leak):
- File ebook gốc lưu private (không public URL trực tiếp)
- Chỉ stream qua endpoint có JWT + kiểm tra quyền sở hữu
- Dùng signed URL ngắn hạn (ví dụ 1-5 phút) cho file tạm
- Tắt cache CDN/public cho response stream cá nhân hóa
- Log đầy đủ user_id, ip, user_agent cho mỗi lần truy cập

13. PHỤ LỤC F: BACKGROUND JOBS
Job	Lịch chạy	Mô tả
ProcessExpiredReservations	mỗi giờ	Hủy reservation hết hạn, không hoàn lại 10%
CheckOverdueBorrows	mỗi ngày 00:00	Đánh dấu quá hạn, tính phạt, ghi nợ nếu không đủ tiền
SendOverdueReminders	mỗi ngày 08:00	Gửi nhắc nhở dựa trên reminder_count
ProcessAutoLockUser	mỗi ngày 09:00	Khóa tài khoản nếu total_debt > 0 và quá hạn nợ > 7 ngày
RemoveNewTagFromBooks	mỗi ngày	Gỡ tag "new" sau 30 ngày
RetryFailedSepayTransactions	mỗi 5 phút	Retry transaction pending > 15 phút
SyncUserTotalDebt	mỗi giờ	Đồng bộ cột total_debt từ bảng user_debts
Cấu hình Laravel:


protected function schedule(Schedule $schedule)
{
    $schedule->job(new ProcessExpiredReservations)->hourly();
    $schedule->job(new CheckOverdueBorrows)->dailyAt('00:00');
    $schedule->job(new SendOverdueReminders)->dailyAt('08:00');
    $schedule->job(new ProcessAutoLockUser)->dailyAt('09:00');
    $schedule->job(new RemoveNewTagFromBooks)->daily();
    $schedule->job(new RetryFailedSepayTransactions)->everyFiveMinutes();
    $schedule->job(new SyncUserTotalDebt)->hourly();
}
14. PHỤ LỤC G: PHÂN QUYỀN CHI TIẾT (BẢNG role_permissions)
Tên quyền	Mô tả
can_manage_books	Thêm/sửa/xóa đầu sách, bản copy
can_manage_borrow_offline	Tạo phiếu mượn/trả tại quầy (kể cả khách vãng lai)
can_manage_reservations	Xác nhận/hủy reservation
can_mark_lost_books	Ghi nhận sách mất/hư
can_verify_cccd	Duyệt hồ sơ CCCD
can_view_reports	Xem các báo cáo (không phải tài chính chi tiết)
can_approve_ebook	Duyệt ebook pending
can_manage_finance	Xem doanh thu, quản lý phí phạt
can_manage_hot_books	Gắn tag hot/featured/carousel
can_manage_users	Khóa/mở khóa user (chỉ user thường)
can_manage_messages	Xóa/sửa tin nhắn nội bộ
Admin luôn có toàn bộ quyền.

15. PHỤ LỤC H: AUDIT LOG VÀ SOFT DELETE
H.1 Audit Log
Mọi hành động quan trọng (duyệt ebook, thay đổi cấu hình, khóa user, phân quyền thủ thư) đều ghi vào bảng audit_logs:


AuditLog::create([
    'user_id' => auth()->id(),
    'action' => 'APPROVE_EBOOK',
    'table_name' => 'ebooks',
    'record_id' => $ebookId,
    'old_values' => json_encode(['status' => 'pending']),
    'new_values' => json_encode(['status' => 'approved']),
    'ip_address' => request()->ip(),
    'user_agent' => request()->userAgent(),
]);
H.2 Soft Delete
Các bảng: users, books, ebooks, book_copies, messages sử dụng trait SoftDeletes.
Khi xóa qua API, thực chất là cập nhật deleted_at.
Các API GET mặc định bắt buộc filter deleted_at IS NULL.
Các quan hệ mặc định không include trashed record nếu không gọi withTrashed().
Admin có thể truy cập thêm bản ghi đã xóa qua tham số ?with_trashed=true.

B.7 Validation nghiệp vụ bắt buộc
- Borrow: không cho mượn nếu user đã có borrow_record active/overdue cùng book_id.
- Reserve: không cho đặt trước nếu user đang mượn book đó hoặc đã có reservation pending cùng book.
- Ebook purchase: không cho mua lại ebook đã mua thành công trước đó.

KẾT THÚC TÀI LIỆU