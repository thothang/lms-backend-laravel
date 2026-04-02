# Hướng Dẫn Sử Dụng API Test Collection - LMS

## Mục Lục
1. [Giới thiệu](#giới-thiệu)
2. [Yêu cầu](#yêu-cầu)
3. [Cài đặt](#cài-đặt)
4. [Hướng dẫn Import](#hướng-dẫn-import)
5. [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
6. [Thứ tự Test API](#thứ-tự-test-api)
7. [Tài khoản Test](#tài-khoản-test)
8. [Mô tả từng nhóm](#mô-tả-từng-nhóm)
9. [Cách chạy Test](#cách-chạy-test)
10. [Xem kết quả](#xem-kết-quả)

---

## Giới thiệu

Bộ Postman Collection này chứa **66 API endpoints** được chia thành **6 nhóm**, phục vụ việc test API cho Hệ thống Quản lý Thư viện (LMS).

| Nhóm | File | Số API |
|------|------|--------|
| 1. Xác thực & Người dùng | `LMS_API_Nhom1_Auth_User.json` | 10 |
| 2. Sách vật lý & Ebook | `LMS_API_Nhom2_Borrow_Book.json` | 13 |
| 3. Thanh toán & Thông báo | `LMS_API_Nhom3_Payment_Notification.json` | 9 |
| 4. Tác giả (Author) | `LMS_API_Nhom4_Author.json` | 5 |
| 5. Thủ thư (Librarian) | `LMS_API_Nhom5_Librarian.json` | 10 |
| 6. Quản trị (Admin) | `LMS_API_Nhom6_Admin.json` | 19 |

---

## Yêu cầu

- **Postman** phiên bản mới nhất ([Download](https://www.postman.com/downloads/))
- **Backend Laravel** đang chạy tại `http://localhost:8000`
- **Database** đã được migrate và seed

---

## Cài đặt

### 1. Clone/Download project
```bash
cd library-management
```

### 2. Cài đặt dependencies
```bash
composer install
```

### 3. Cấu hình file .env
```bash
cp .env.example .env
php artisan key:generate
```

### 4. Tạo database
```sql
CREATE DATABASE library_management;
```

### 5. Chạy migrations và seed
```bash
php artisan migrate:fresh --seed
```

### 6. Khởi động server
```bash
php artisan serve
```
Server sẽ chạy tại: **http://localhost:8000**

---

## Hướng dẫn Import

### Cách 1: Import từng file
1. Mở **Postman**
2. Click **Import** (góc trái trên)
3. Kéo thả file `.json` hoặc click **Upload Files**
4. Chọn file cần import
5. Click **Import**

### Cách 2: Import tất cả cùng lúc
1. Mở **Postman**
2. Click **Import**
3. Kéo thả tất cả 6 file `.json` vào
4. Click **Import**

---

## Cấu hình biến môi trường

### Tạo Environment mới:

1. Click **Environments** (biểu tượng bánh răng) → **+ Add**

2. Đặt tên: `LMS Local`

3. Thêm các biến:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:8000/api` | `http://localhost:8000/api` |
| `token` | ` ` | ` ` |
| `adminToken` | ` ` | ` ` |
| `librarianToken` | ` ` | ` ` |
| `authorToken` | ` ` | ` ` |

4. Click **Save**

5. Chọn Environment: **LMS Local** từ dropdown góc phải trên

---

## Thứ tự Test API

### Bước 1: Đăng nhập (Nhóm 1)
```
1. Đăng nhập Admin → Lấy token tự động set vào {{token}} và {{adminToken}}
2. Đăng nhập Librarian → Set vào {{librarianToken}}
```

### Bước 2: Test các nhóm còn lại
```
Nhóm 1: Xác thực & Profile
Nhóm 2: Sách vật lý & Ebook
Nhóm 3: Thanh toán & Thông báo
Nhóm 4: Tác giả (cần user có role author)
Nhóm 5: Thủ thư (cần token librarian)
Nhóm 6: Admin (cần token admin)
```

---

## Tài khoản Test

Sau khi chạy `php artisan db:seed`, các tài khoản mặc định:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@library.com` | `password` |
| Librarian | `librarian@library.com` | `password` |
| User | `user@library.com` | `password` |
| Author | `author@library.com` | `password` |

> **Lưu ý:** Để test Nhóm 4 (Author), cần đăng nhập bằng tài khoản có role `author`.

---

## Mô tả từng nhóm

### Nhóm 1: Xác thực & Người dùng (13 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| Đăng ký | POST | Tạo tài khoản mới |
| Đăng nhập Admin | POST | Lấy JWT token |
| Đăng nhập Librarian | POST | Lấy JWT token |
| Làm mới Token | POST | Refresh JWT (token cũ vào blacklist) |
| Đăng xuất | POST | Hủy token (thêm vào blacklist) |
| Test Token Blacklist | GET | Xác nhận token cũ bị từ chối |
| Đăng nhập lại | POST | Lấy token mới |
| Quên mật khẩu | POST | Gửi email reset |
| Lấy Profile | GET | Thông tin cá nhân |
| Cập nhật Profile | PUT | Sửa thông tin |
| Đổi mật khẩu | POST | Thay đổi password |
| Số dư ví | GET | Xem số dư |

---

### Nhóm 2: Sách vật lý & Ebook (13 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| Mượn sách | POST | Mượn với copy_id |
| Trả sách | POST | Trả với borrow_id |
| Gia hạn | POST | Gia hạn thêm ngày |
| Lịch sử mượn | GET | Xem lịch sử |
| Đặt trước | POST | Reservation |
| DS đặt trước | GET | Xem reservation |
| Hủy đặt trước | DELETE | Hủy reservation |
| Sách đã mua | GET | Ebook purchased |
| Mua ebook | POST | Purchase ebook |
| Đánh giá sách | POST | Review book |
| Đánh giá ebook | POST | Review ebook |
| Danh sách sách | GET | List books |
| Chi tiết sách | GET | Book detail |

---

### Nhóm 3: Thanh toán & Thông báo (9 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| Nạp tiền | POST | Tạo payment Sepay |
| Sepay Callback | POST | Webhook test |
| Mua vé thư viện | POST | Library ticket |
| Lấy thông báo | GET | Notifications |
| Đánh dấu đọc | PUT | Mark read |
| Tin nhắn đã nhận | GET | Received |
| Tin nhắn đã gửi | GET | Sent |
| Gửi tin nhắn | POST | Send message |
| Đọc tin nhắn | PUT | Mark message read |

---

### Nhóm 4: Tác giả (5 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| Upload ebook | POST | Upload PDF |
| DS ebook | GET | List my ebooks |
| Cập nhật ebook | PUT | Update ebook |
| Xem doanh thu | GET | Earnings |
| Rút tiền | POST | Withdraw |

---

### Nhóm 5: Thủ thư (10 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| Tạo sách | POST | Add book |
| Cập nhật sách | PUT | Edit book |
| Thêm copy | POST | Add copies |
| Gắn hot/carousel | POST | Set tags |
| Mượn offline | POST | Guest borrow |
| Trả offline | POST | Guest return |
| DS reservation | GET | Reservations |
| Xác nhận reservation | POST | Confirm |
| Đánh dấu mất | POST | Mark lost |
| Duyệt CCCD | PUT | Verify CCCD |

---

### Nhóm 6: Admin (19 APIs)
| API | Method | Mô tả |
|-----|--------|--------|
| DS user | GET | All users |
| Lọc user | GET | Filter by role |
| Khóa user | PUT | Lock/unlock |
| Nâng cấp author | POST | Make author |
| DS quyền | GET | Permissions |
| Cập nhật quyền | PUT | Update perms |
| Ebook chờ duyệt | GET | Pending ebooks |
| Duyệt ebook | POST | Approve |
| Từ chối ebook | POST | Reject |
| DS rút tiền | GET | Withdrawals |
| Duyệt rút tiền | POST | Process |
| Lấy cấu hình | GET | Settings |
| Cập nhật cấu hình | PUT | Update settings |
| Báo cáo tổng quan | GET | Overview |
| Báo cáo mượn trả | GET | Borrowings |
| Báo cáo doanh thu | GET | Revenue |
| Audit logs | GET | System logs |
| Lọc audit log | GET | Filter logs |

---

## Cách chạy Test

### Cách 1: Chạy từng API
1. Chọn API từ sidebar
2. Click **Send**
3. Xem response

### Cách 2: Chạy cả nhóm
1. Click vào **folder nhóm** (ví dụ: "Nhóm 1")
2. Click **Run folder**
3. Chọn các API muốn test
4. Click **Run**

### Cách 3: Chạy Collection (khuyến nghị)
1. Click vào **Collection** (ví dụ: "LMS API - Nhóm 1")
2. Click **Run collection**
3. Cấu hình:
   - **Iterations**: 1
   - **Delay**: 500ms
   - **Environment**: LMS Local
4. Click **Run LMS API - Nhóm 1**

---

## Xem kết quả

### Tab Tests
- Mỗi API đã có script test sẵn
- Kết quả hiển thị ở tab **Test Results**

### Các test có sẵn:
```javascript
// Kiểm tra status code
pm.test('Status code is 200', function() {
    pm.response.to.have.status(200);
});

// Kiểm tra response có trường
pm.test('Response has data', function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});

// Set token tự động
pm.test('Set token', function() {
    var jsonData = pm.response.json();
    pm.collectionVariables.set('token', jsonData.access_token);
});
```

---

## JWT Blacklist Testing

### Luồng test Token hoàn chỉnh:
```
1. Đăng nhập (Admin)     → Lấy token
2. Làm mới Token         → Token cũ vào blacklist, nhận token mới
3. Test Token Blacklist   → Dùng token cũ → PHẢI trả 401
4. Đăng xuất             → Token hiện tại vào blacklist
5. Test Token Blacklist   → Dùng token đã logout → PHẢI trả 401
6. Đăng nhập lại         → Lấy token mới
```

### Các biến sử dụng:
| Variable | Mô tả |
|----------|--------|
| `token` | Token hiện tại đang sử dụng |
| `oldToken` | Token đã bị blacklist (để test) |
| `adminToken` | Token của admin |
| `librarianToken` | Token của librarian |

### Cách chạy test JWT:
1. Chạy **"1.2 Đăng nhập (Admin)"** trước
2. Chạy **"1.4 Làm mới Token"** - Token cũ được lưu vào blacklist
3. Chạy **"1.6 Test Token đã Logout"** - Xác nhận token cũ bị từ chối (401)
4. Chạy **"1.5 Đăng xuất"** - Token hiện tại được thêm vào blacklist
5. Chạy **"1.6 Test Token đã Logout"** - Xác nhận token đã logout bị từ chối (401)
6. Chạy **"1.7 Đăng nhập lại"** - Lấy token mới

---

## Xử lý lỗi thường gặp

### Lỗi 401 Unauthorized
- Chưa đăng nhập hoặc token hết hạn
- **Giải pháp:** Chạy lại API Login

### Lỗi 403 Forbidden
- Không có quyền truy cập API
- **Giải pháp:** Đăng nhập với tài khoản có role phù hợp

### Lỗi 422 Validation
- Dữ liệu gửi không hợp lệ
- **Giải pháp:** Kiểm tra request body

### Lỗi 500 Server Error - jwt_blacklist
- **Nguyên nhân:** Thiếu bảng `jwt_blacklist` trong database
- **Giải pháp:** Đã có sẵn migration, chạy:
```bash
php artisan migrate
```
- **Giải thích:** Bảng này lưu các token đã bị logout hoặc refresh, không cho phép tái sử dụng

---

## Cấu trúc thư mục

```
library-management/
├── postman/
│   ├── LMS_API_Nhom1_Auth_User.json
│   ├── LMS_API_Nhom2_Borrow_Book.json
│   ├── LMS_API_Nhom3_Payment_Notification.json
│   ├── LMS_API_Nhom4_Author.json
│   ├── LMS_API_Nhom5_Librarian.json
│   ├── LMS_API_Nhom6_Admin.json
│   └── README_POSTMAN.md          ← File này
├── API_DOCUMENTATION.md
└── ...
```

---

## Liên hệ & Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra backend đang chạy: `php artisan serve`
2. Kiểm tra database: `php artisan migrate:fresh --seed`
3. Kiểm tra .env configuration

---

**Chúc bạn test vui vẻ!** 🎉
