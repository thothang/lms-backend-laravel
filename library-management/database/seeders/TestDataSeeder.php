<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookCopy;
use App\Models\BorrowRecord;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\LibraryTicket;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserDebt;
use App\Models\WithdrawalRequest;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = \Faker\Factory::create('vi_VN');
        $categories = BookCategory::all();

        // =============================================
        // 1. USERS - All roles and statuses
        // =============================================

        // Author user
        $author = User::firstOrCreate(
            ['email' => 'author@example.com'],
            [
                'name' => 'Nguyễn Văn Tác Giả',
                'password' => Hash::make('password'),
                'phone' => '0901234567',
                'address' => 'Hà Nội',
                'dob' => '1985-06-15',
                'role' => 'author',
                'status' => 'active',
                'earnings_balance' => 500000,
                'total_earned' => 1500000,
                'email_verified_at' => now(),
            ]
        );

        // Second author
        $author2 = User::firstOrCreate(
            ['email' => 'author2@example.com'],
            [
                'name' => 'Trần Thị Viết Văn',
                'password' => Hash::make('password'),
                'phone' => '0901234568',
                'dob' => '1990-03-20',
                'role' => 'author',
                'status' => 'active',
                'earnings_balance' => 200000,
                'total_earned' => 800000,
                'email_verified_at' => now(),
            ]
        );

        // Active users for borrowing/purchasing
        $activeUsers = [];
        $userNames = [
            'Lê Minh Hoàng', 'Phạm Thị Mai', 'Ngô Đức Thắng',
            'Vũ Thị Lan', 'Đặng Văn Hùng',
        ];
        foreach ($userNames as $i => $name) {
            $activeUsers[] = User::create([
                'name' => $name,
                'email' => 'user' . ($i + 1) . '@example.com',
                'password' => Hash::make('password'),
                'phone' => '09' . str_pad($i + 10, 8, '0', STR_PAD_LEFT),
                'address' => $faker->address,
                'dob' => $faker->dateTimeBetween('-40 years', '-18 years')->format('Y-m-d'),
                'role' => 'user',
                'status' => 'active',
                'balance' => $faker->randomElement([100000, 200000, 500000, 1000000]),
                'email_verified_at' => now(),
            ]);
        }

        // Unverified user
        $unverifiedUser = User::create([
            'name' => 'Bùi Thế Mới',
            'email' => 'unverified@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'status' => 'unverified',
            'verification_token' => \Illuminate\Support\Str::random(60),
        ]);

        // Blocked user
        $blockedUser = User::create([
            'name' => 'Hoàng Văn Khóa',
            'email' => 'blocked@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'status' => 'blocked',
            'email_verified_at' => now(),
        ]);

        // User with debt
        $debtUser = User::create([
            'name' => 'Trần Nợ Nhiều',
            'email' => 'debt@example.com',
            'password' => Hash::make('password'),
            'phone' => '0909999888',
            'role' => 'user',
            'status' => 'active',
            'balance' => 50000,
            'total_debt' => 75000,
            'email_verified_at' => now(),
        ]);

        $this->command->info('Users seeded.');

        // =============================================
        // 2. BOOKS - Hot, Featured, Carousel, Normal
        // =============================================

        $bookTemplates = [
            // Carousel books
            ['title' => 'Lập trình PHP Laravel 12', 'author_name' => 'Taylor Otwell', 'price' => 150000, 'daily_fee' => 5000, 'is_hot' => true, 'is_featured' => true, 'in_carousel' => true, 'carousel_order' => 1],
            ['title' => 'Clean Architecture', 'author_name' => 'Robert C. Martin', 'price' => 200000, 'daily_fee' => 8000, 'is_hot' => false, 'is_featured' => true, 'in_carousel' => true, 'carousel_order' => 2],
            ['title' => 'Nhà Giả Kim', 'author_name' => 'Paulo Coelho', 'price' => 100000, 'daily_fee' => 2000, 'is_hot' => true, 'is_featured' => true, 'in_carousel' => true, 'carousel_order' => 3],
            // Hot books
            ['title' => 'Đắc Nhân Tâm', 'author_name' => 'Dale Carnegie', 'price' => 120000, 'daily_fee' => 3000, 'is_hot' => true, 'is_featured' => false, 'in_carousel' => false],
            ['title' => 'Tư Duy Nhanh Và Chậm', 'author_name' => 'Daniel Kahneman', 'price' => 180000, 'daily_fee' => 6000, 'is_hot' => true, 'is_featured' => false, 'in_carousel' => false],
            ['title' => 'Sapiens - Lược Sử Loài Người', 'author_name' => 'Yuval Noah Harari', 'price' => 220000, 'daily_fee' => 7000, 'is_hot' => true, 'is_featured' => false, 'in_carousel' => false],
            // Featured books
            ['title' => 'Bố Già', 'author_name' => 'Mario Puzo', 'price' => 160000, 'daily_fee' => 5000, 'is_hot' => false, 'is_featured' => true, 'in_carousel' => false],
            ['title' => 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 'author_name' => 'Rosie Nguyễn', 'price' => 90000, 'daily_fee' => 2000, 'is_hot' => false, 'is_featured' => true, 'in_carousel' => false],
            // Normal books
            ['title' => 'Cây Cam Ngọt Của Tôi', 'author_name' => 'José Mauro de Vasconcelos', 'price' => 110000, 'daily_fee' => 3000, 'is_hot' => false, 'is_featured' => false, 'in_carousel' => false],
            ['title' => 'Dế Mèn Phiêu Lưu Ký', 'author_name' => 'Tô Hoài', 'price' => 60000, 'daily_fee' => 1500, 'is_hot' => false, 'is_featured' => false, 'in_carousel' => false],
        ];

        $books = [];
        foreach ($bookTemplates as $tmpl) {
            $copyCount = rand(3, 6);
            $book = Book::create(array_merge($tmpl, [
                'category_id' => $categories->random()->id,
                'publisher' => $faker->randomElement(['NXB Kim Đồng', 'NXB Trẻ', 'NXB Tổng hợp TP.HCM', 'NXB Giáo Dục']),
                'description' => $faker->realText(200),
                'cover_image' => 'https://placehold.co/400x600/' . substr(md5($tmpl['title']), 0, 6) . '/ffffff?text=' . urlencode(mb_substr($tmpl['title'], 0, 15)),
                'total_copies' => $copyCount,
                'available_copies' => $copyCount,
            ]));

            for ($j = 1; $j <= $copyCount; $j++) {
                BookCopy::create([
                    'book_id' => $book->id,
                    'barcode' => 'BK' . str_pad($book->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($j, 3, '0', STR_PAD_LEFT),
                    'status' => 'available',
                ]);
            }
            $books[] = $book;
        }

        // Generate more books with Faker
        for ($i = 0; $i < 15; $i++) {
            $copyCount = rand(2, 5);
            $book = Book::create([
                'title' => rtrim($faker->sentence(mt_rand(3, 6)), '.'),
                'author_name' => $faker->name,
                'category_id' => $categories->random()->id,
                'publisher' => 'NXB ' . $faker->company,
                'description' => $faker->realText(200),
                'cover_image' => 'https://placehold.co/400x600/' . $faker->randomElement(['ef4444', 'f59e0b', '10b981', '3b82f6', '8b5cf6', 'ec4899']) . '/ffffff?text=Book+' . ($i + 11),
                'price' => $faker->randomElement([80000, 120000, 150000, 200000]),
                'daily_fee' => $faker->randomElement([2000, 3000, 5000]),
                'is_featured' => $i < 5,
                'is_hot' => $i >= 5 && $i < 10,
                'in_carousel' => false,
                'total_copies' => $copyCount,
                'available_copies' => $copyCount,
            ]);

            for ($j = 1; $j <= $copyCount; $j++) {
                BookCopy::create([
                    'book_id' => $book->id,
                    'barcode' => 'BK' . str_pad($book->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($j, 3, '0', STR_PAD_LEFT),
                    'status' => 'available',
                ]);
            }
            $books[] = $book;
        }

        $this->command->info('Books & Copies seeded.');

        // =============================================
        // 3. EBOOKS - All statuses, free & paid
        // =============================================

        $ebookTemplates = [
            // Free ebooks
            ['title' => 'Cuộc Phiêu Lưu Kỳ Thú Của Ếch Xanh', 'price' => 0, 'is_free' => true, 'status' => 'approved', 'author_id' => $author->id],
            ['title' => 'Hành Trình Phát Triển Bản Thân', 'price' => 0, 'is_free' => true, 'status' => 'approved', 'author_id' => $author->id],
            ['title' => 'Cẩm Nang Lập Trình Python', 'price' => 0, 'is_free' => true, 'status' => 'approved', 'author_id' => $author2->id],
            // Paid ebooks
            ['title' => 'Bí Quyết Đầu Tư Chứng Khoán', 'price' => 99000, 'is_free' => false, 'status' => 'approved', 'author_id' => $author->id],
            ['title' => 'Khởi Nghiệp Tinh Gọn', 'price' => 150000, 'is_free' => false, 'status' => 'approved', 'author_id' => $author->id],
            ['title' => 'Thiết Kế UX/UI Chuyên Nghiệp', 'price' => 120000, 'is_free' => false, 'status' => 'approved', 'author_id' => $author2->id],
            // Pending ebook
            ['title' => 'Ebook Đang Chờ Duyệt', 'price' => 80000, 'is_free' => false, 'status' => 'pending', 'author_id' => $author->id],
            ['title' => 'Sách Mới Gửi Duyệt', 'price' => 0, 'is_free' => true, 'status' => 'pending', 'author_id' => $author2->id],
            // Rejected ebook
            ['title' => 'Ebook Bị Từ Chối', 'price' => 50000, 'is_free' => false, 'status' => 'rejected', 'author_id' => $author->id, 'rejection_reason' => 'Nội dung không phù hợp với tiêu chuẩn thư viện.'],
        ];

        $ebooks = [];
        foreach ($ebookTemplates as $tmpl) {
            $ebook = Ebook::create(array_merge($tmpl, [
                'category_id' => $categories->random()->id,
                'description' => $faker->realText(200),
                'cover_image' => 'https://placehold.co/400x600/' . substr(md5($tmpl['title']), 0, 6) . '/ffffff?text=' . urlencode(mb_substr($tmpl['title'], 0, 12)),
                'file_path' => 'ebooks/sample.pdf',
                'free_preview_pages' => rand(3, 10),
            ]));
            $ebooks[] = $ebook;
        }

        // Generate more free ebooks with Faker
        for ($i = 0; $i < 10; $i++) {
            $ebooks[] = Ebook::create([
                'title' => 'Free: ' . rtrim($faker->sentence(mt_rand(3, 5)), '.'),
                'author_id' => $faker->randomElement([$author->id, $author2->id]),
                'category_id' => $categories->random()->id,
                'description' => $faker->realText(200),
                'cover_image' => 'https://placehold.co/400x600/10b981/ffffff?text=Free+' . ($i + 1),
                'price' => 0,
                'is_free' => true,
                'file_path' => 'ebooks/sample.pdf',
                'status' => 'approved',
                'free_preview_pages' => 5,
            ]);
        }

        // Generate paid ebooks
        for ($i = 0; $i < 5; $i++) {
            $ebooks[] = Ebook::create([
                'title' => 'Premium: ' . rtrim($faker->sentence(mt_rand(3, 5)), '.'),
                'author_id' => $faker->randomElement([$author->id, $author2->id]),
                'category_id' => $categories->random()->id,
                'description' => $faker->realText(200),
                'cover_image' => 'https://placehold.co/400x600/f59e0b/ffffff?text=Paid+' . ($i + 1),
                'price' => $faker->randomElement([49000, 79000, 99000, 149000]),
                'is_free' => false,
                'file_path' => 'ebooks/sample.pdf',
                'status' => 'approved',
                'free_preview_pages' => 3,
            ]);
        }

        $this->command->info('Ebooks seeded.');

        // =============================================
        // 4. BORROW RECORDS - active, returned, overdue, lost
        // =============================================

        $approvedEbooks = collect($ebooks)->filter(fn($e) => $e->status === 'approved' && !$e->is_free);

        // Active borrow - Borrow ALL copies of $books[0] so it has 0 available and can be reserved
        $copiesOfBook0 = BookCopy::where('book_id', $books[0]->id)->where('status', 'available')->get();
        foreach ($copiesOfBook0 as $idx => $copy) {
            $copy->update(['status' => 'borrowed']);
            $books[0]->decrement('available_copies');
            
            // Create a borrow record for each copy
            BorrowRecord::create([
                'user_id' => $activeUsers[$idx % count($activeUsers)]->id,
                'copy_id' => $copy->id,
                'borrow_date' => Carbon::now()->subDays(rand(1, 5)),
                'due_date' => Carbon::now()->addDays(rand(5, 10)),
                'daily_fee_applied' => $books[0]->daily_fee,
                'deposit_amount' => $books[0]->getDepositAmount(),
                'prepaid_amount' => $books[0]->daily_fee * 7, // Default 7 days
                'status' => 'active',
            ]);
        }

        // Returned borrow
        $copy2 = BookCopy::where('book_id', $books[1]->id)->where('status', 'available')->first();
        if ($copy2) {
            BorrowRecord::create([
                'user_id' => $activeUsers[1]->id,
                'copy_id' => $copy2->id,
                'borrow_date' => Carbon::now()->subDays(20),
                'due_date' => Carbon::now()->subDays(11),
                'return_date' => Carbon::now()->subDays(12),
                'daily_fee_applied' => $books[1]->daily_fee,
                'deposit_amount' => $books[1]->price * 0.3,
                'status' => 'returned',
            ]);
        }

        // Overdue borrow
        $copy3 = BookCopy::where('book_id', $books[3]->id)->where('status', 'available')->first();
        if ($copy3) {
            $copy3->update(['status' => 'borrowed']);
            $books[3]->decrement('available_copies');
            $overdueBorrow = BorrowRecord::create([
                'user_id' => $debtUser->id,
                'copy_id' => $copy3->id,
                'borrow_date' => Carbon::now()->subDays(15),
                'due_date' => Carbon::now()->subDays(6),
                'daily_fee_applied' => $books[3]->daily_fee,
                'deposit_amount' => $books[3]->price * 0.3,
                'status' => 'overdue',
            ]);
        }

        // Lost book
        $copy4 = BookCopy::where('book_id', $books[4]->id)->where('status', 'available')->first();
        if ($copy4) {
            $copy4->update(['status' => 'lost']);
            $books[4]->decrement('available_copies');
            $lostBorrow = BorrowRecord::create([
                'user_id' => $debtUser->id,
                'copy_id' => $copy4->id,
                'borrow_date' => Carbon::now()->subDays(30),
                'due_date' => Carbon::now()->subDays(21),
                'daily_fee_applied' => $books[4]->daily_fee,
                'deposit_amount' => $books[4]->price * 0.3,
                'status' => 'lost',
            ]);
        }

        // Renewed borrow
        $copy5 = BookCopy::where('book_id', $books[5]->id)->where('status', 'available')->first();
        if ($copy5) {
            $copy5->update(['status' => 'borrowed']);
            $books[5]->decrement('available_copies');
            BorrowRecord::create([
                'user_id' => $activeUsers[2]->id,
                'copy_id' => $copy5->id,
                'borrow_date' => Carbon::now()->subDays(7),
                'due_date' => Carbon::now()->addDays(11),
                'daily_fee_applied' => $books[5]->daily_fee,
                'deposit_amount' => $books[5]->price * 0.3,
                'renew_count' => 1,
                'status' => 'active',
            ]);
        }

        // Guest offline borrow
        $copy6 = BookCopy::where('book_id', $books[6]->id)->where('status', 'available')->first();
        if ($copy6) {
            $copy6->update(['status' => 'borrowed']);
            $books[6]->decrement('available_copies');
            BorrowRecord::create([
                'user_id' => null,
                'guest_name' => 'Nguyễn Văn Khách',
                'guest_phone' => '0912345678',
                'copy_id' => $copy6->id,
                'borrow_date' => Carbon::now()->subDays(2),
                'due_date' => Carbon::now()->addDays(7),
                'daily_fee_applied' => $books[6]->daily_fee,
                'deposit_amount' => $books[6]->price * 0.3,
                'status' => 'active',
            ]);
        }

        $this->command->info('Borrow records seeded.');

        // =============================================
        // 5. RESERVATIONS - pending, confirmed, cancelled, expired
        // =============================================

        Reservation::create([
            'user_id' => $activeUsers[3]->id,
            'book_id' => $books[0]->id,
            'expected_borrow_days' => 7,
            'reservation_date' => Carbon::now(),
            'expiry_date' => Carbon::now()->addDays(3),
            'fee_paid' => 10000,
            'status' => 'pending',
            'queue_order' => 1,
        ]);

        Reservation::create([
            'user_id' => $activeUsers[4]->id,
            'book_id' => $books[0]->id,
            'expected_borrow_days' => 5,
            'reservation_date' => Carbon::now()->subDays(1),
            'expiry_date' => Carbon::now()->addDays(2),
            'fee_paid' => 10000,
            'status' => 'pending',
            'queue_order' => 2,
        ]);

        // Pick books[2] and clear its available copies for the expired reservation case
        $copiesOfBook2 = BookCopy::where('book_id', $books[2]->id)->where('status', 'available')->get();
        foreach ($copiesOfBook2 as $copy) {
            $copy->update(['status' => 'borrowed']);
            $books[2]->decrement('available_copies');
        }

        Reservation::create([
            'user_id' => $activeUsers[1]->id,
            'book_id' => $books[2]->id,
            'expected_borrow_days' => 9,
            'reservation_date' => Carbon::now()->subDays(5),
            'expiry_date' => Carbon::now()->subDays(2),
            'fee_paid' => 10000,
            'status' => 'expired',
            'queue_order' => 1,
        ]);

        $this->command->info('Reservations seeded.');

        // =============================================
        // 6. EBOOK PURCHASES
        // =============================================

        $purchasedEbooks = $approvedEbooks->values()->take(3);
        foreach ($purchasedEbooks as $idx => $ebook) {
            if (!isset($activeUsers[$idx])) continue;
            EbookPurchase::create([
                'user_id' => $activeUsers[$idx]->id,
                'ebook_id' => $ebook->id,
                'purchase_date' => Carbon::now()->subDays(rand(1, 15)),
                'amount' => $ebook->price,
            ]);
        }

        // User purchased a free ebook
        $freeEbook = collect($ebooks)->first(fn($e) => $e->is_free && $e->status === 'approved');
        if ($freeEbook) {
            EbookPurchase::create([
                'user_id' => $activeUsers[0]->id,
                'ebook_id' => $freeEbook->id,
                'purchase_date' => Carbon::now()->subDays(5),
                'amount' => 0,
            ]);
        }

        $this->command->info('Ebook purchases seeded.');

        // =============================================
        // 7. REVIEWS - for books and ebooks
        // =============================================

        // Book review (user who returned a book)
        Review::create([
            'user_id' => $activeUsers[1]->id,
            'book_id' => $books[1]->id,
            'rating' => 5,
            'comment' => 'Cuốn sách rất hay, kiến thức bổ ích!',
        ]);
        Review::create([
            'user_id' => $activeUsers[0]->id,
            'book_id' => $books[0]->id,
            'rating' => 4,
            'comment' => 'Nội dung tốt, hơi dài nhưng đáng đọc.',
        ]);
        Review::create([
            'user_id' => $activeUsers[2]->id,
            'book_id' => $books[5]->id,
            'rating' => 3,
            'comment' => 'Được, nhưng không như kỳ vọng.',
        ]);

        // Ebook reviews
        foreach ($purchasedEbooks as $idx => $ebook) {
            Review::create([
                'user_id' => $activeUsers[$idx]->id,
                'ebook_id' => $ebook->id,
                'rating' => rand(3, 5),
                'comment' => $faker->randomElement([
                    'Ebook rất tiện, đọc mọi lúc mọi nơi.',
                    'Nội dung chất lượng, đáng đồng tiền.',
                    'Hay nhưng cần thêm hình ảnh minh họa.',
                ]),
            ]);
        }

        $this->command->info('Reviews seeded.');

        // =============================================
        // 8. TRANSACTIONS - deposits, fees, purchases
        // =============================================

        // Deposits
        foreach ($activeUsers as $idx => $user) {
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $user->balance > 0 ? $user->balance : 200000,
                'type' => 'deposit',
                'status' => 'success',
                'payment_gateway' => 'Sepay',
                'gateway_transaction_id' => 'SEP' . str_pad($user->id, 8, '0', STR_PAD_LEFT),
                'metadata' => ['note' => 'Nạp tiền qua Sepay'],
                'created_at' => Carbon::now()->subDays(rand(5, 20)),
            ]);
        }

        // Borrow fee transaction
        Transaction::create([
            'user_id' => $activeUsers[0]->id,
            'amount' => $books[0]->daily_fee * 9,
            'type' => 'borrow_fee',
            'status' => 'success',
            'metadata' => ['book_title' => $books[0]->title],
            'created_at' => Carbon::now()->subDays(3),
        ]);

        // Ebook purchase transactions
        foreach ($purchasedEbooks as $idx => $ebook) {
            Transaction::create([
                'user_id' => $activeUsers[$idx]->id,
                'amount' => $ebook->price,
                'type' => 'ebook_purchase',
                'status' => 'success',
                'metadata' => ['ebook_id' => $ebook->id, 'ebook_title' => $ebook->title],
                'created_at' => Carbon::now()->subDays(rand(1, 15)),
            ]);
        }

        // Penalty transaction
        Transaction::create([
            'user_id' => $debtUser->id,
            'amount' => 75000,
            'type' => 'penalty',
            'status' => 'success',
            'metadata' => ['reason' => 'Phạt trả sách trễ và mất sách'],
            'created_at' => Carbon::now()->subDays(5),
        ]);

        // Pending deposit
        Transaction::create([
            'user_id' => $activeUsers[2]->id,
            'amount' => 500000,
            'type' => 'deposit',
            'status' => 'pending',
            'payment_gateway' => 'Sepay',
            'metadata' => ['note' => 'Đang chờ xác nhận thanh toán'],
            'created_at' => Carbon::now()->subHours(2),
        ]);

        // Failed deposit
        Transaction::create([
            'user_id' => $activeUsers[3]->id,
            'amount' => 100000,
            'type' => 'deposit',
            'status' => 'failed',
            'payment_gateway' => 'Sepay',
            'metadata' => ['error' => 'Hết thời gian thanh toán'],
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $this->command->info('Transactions seeded.');

        // =============================================
        // 9. USER DEBTS
        // =============================================

        if (isset($overdueBorrow)) {
            UserDebt::create([
                'user_id' => $debtUser->id,
                'amount' => 30000,
                'paid_amount' => 0,
                'reason' => 'overdue_penalty',
                'borrow_record_id' => $overdueBorrow->id,
                'status' => 'pending',
                'reminder_count' => 1,
                'last_reminder_at' => Carbon::now()->subDays(1),
                'due_date' => Carbon::now()->addDays(6),
            ]);
        }

        if (isset($lostBorrow)) {
            UserDebt::create([
                'user_id' => $debtUser->id,
                'amount' => 45000,
                'paid_amount' => 0,
                'reason' => 'lost_book_damage',
                'borrow_record_id' => $lostBorrow->id,
                'status' => 'pending',
                'reminder_count' => 2,
                'last_reminder_at' => Carbon::now()->subDays(2),
                'due_date' => Carbon::now()->addDays(3),
            ]);
        }

        $this->command->info('User debts seeded.');

        // =============================================
        // 10. NOTIFICATIONS
        // =============================================

        foreach ($activeUsers as $user) {
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Chào mừng bạn đến với Thư viện!',
                'content' => 'Tài khoản đã được kích hoạt thành công.',
                'type' => 'web',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(30),
            ]);
        }

        // Overdue notification
        Notification::create([
            'user_id' => $debtUser->id,
            'title' => 'Sách quá hạn',
            'content' => 'Bạn có sách chưa trả quá hạn. Vui lòng trả sách sớm để tránh phí phạt.',
            'type' => 'web',
            'is_read' => false,
        ]);

        // Debt reminder
        Notification::create([
            'user_id' => $debtUser->id,
            'title' => 'Nhắc nhở thanh toán nợ',
            'content' => 'Bạn có khoản nợ 75,000đ cần thanh toán.',
            'type' => 'web',
            'is_read' => false,
        ]);

        // Ebook approved notification for author
        Notification::create([
            'user_id' => $author->id,
            'title' => 'Ebook được duyệt',
            'content' => 'Ebook "Bí Quyết Đầu Tư Chứng Khoán" đã được duyệt thành công.',
            'type' => 'web',
            'is_read' => true,
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $this->command->info('Notifications seeded.');

        // =============================================
        // 11. MESSAGES
        // =============================================

        // Get admin and librarian
        $admin = User::where('role', 'admin')->first();
        $librarian = User::where('role', 'librarian')->first();

        if ($admin && $librarian) {
            Message::create([
                'from_user_id' => $activeUsers[0]->id,
                'to_user_id' => $librarian->id,
                'message' => 'Xin chào, tôi muốn hỏi về thời gian mở cửa thư viện ngày cuối tuần?',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(3),
            ]);
            Message::create([
                'from_user_id' => $librarian->id,
                'to_user_id' => $activeUsers[0]->id,
                'message' => 'Chào bạn! Thư viện mở cửa từ 8h-17h vào thứ 7 và nghỉ Chủ nhật.',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(3)->addHours(2),
            ]);
            Message::create([
                'from_user_id' => $debtUser->id,
                'to_user_id' => $admin->id,
                'message' => 'Tôi muốn xin giảm phí phạt trả sách trễ. Xin cảm ơn.',
                'is_read' => false,
                'created_at' => Carbon::now()->subDays(1),
            ]);
            Message::create([
                'from_user_id' => $author->id,
                'to_user_id' => $admin->id,
                'message' => 'Xin hỏi khi nào ebook mới của tôi được duyệt ạ?',
                'is_read' => false,
                'created_at' => Carbon::now()->subHours(6),
            ]);
        }

        $this->command->info('Messages seeded.');

        // =============================================
        // 12. LIBRARY TICKETS
        // =============================================

        // Active ticket
        LibraryTicket::create([
            'user_id' => $activeUsers[0]->id,
            'purchase_date' => Carbon::now()->subDays(10),
            'valid_from' => Carbon::now()->subDays(10),
            'valid_to' => Carbon::now()->addDays(20),
            'amount' => 300000,
        ]);

        // Expired ticket
        LibraryTicket::create([
            'user_id' => $activeUsers[1]->id,
            'purchase_date' => Carbon::now()->subDays(60),
            'valid_from' => Carbon::now()->subDays(60),
            'valid_to' => Carbon::now()->subDays(30),
            'amount' => 300000,
        ]);

        // Transaction for ticket
        Transaction::create([
            'user_id' => $activeUsers[0]->id,
            'amount' => 300000,
            'type' => 'library_ticket',
            'status' => 'success',
            'metadata' => ['days' => 30],
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $this->command->info('Library tickets seeded.');

        // =============================================
        // 13. WITHDRAWAL REQUESTS
        // =============================================

        // Completed withdrawal
        WithdrawalRequest::create([
            'author_id' => $author->id,
            'amount' => 1000000,
            'bank_account_info' => [
                'bank_name' => 'Vietcombank',
                'account_number' => '0123456789',
                'account_holder' => 'NGUYEN VAN TAC GIA',
            ],
            'status' => 'completed',
            'admin_notes' => 'Đã chuyển khoản thành công.',
            'created_at' => Carbon::now()->subDays(15),
        ]);

        // Pending withdrawal
        WithdrawalRequest::create([
            'author_id' => $author->id,
            'amount' => 300000,
            'bank_account_info' => [
                'bank_name' => 'Vietcombank',
                'account_number' => '0123456789',
                'account_holder' => 'NGUYEN VAN TAC GIA',
            ],
            'status' => 'pending',
            'created_at' => Carbon::now()->subDays(2),
        ]);

        // Rejected withdrawal
        WithdrawalRequest::create([
            'author_id' => $author2->id,
            'amount' => 100000,
            'bank_account_info' => [
                'bank_name' => 'Techcombank',
                'account_number' => '9876543210',
                'account_holder' => 'TRAN THI VIET VAN',
            ],
            'status' => 'rejected',
            'admin_notes' => 'Số dư không đủ để rút.',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        $this->command->info('Withdrawal requests seeded.');
        $this->command->info('=== ALL TEST DATA SEEDED SUCCESSFULLY ===');
    }
}
