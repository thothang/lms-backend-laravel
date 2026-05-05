<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\BookCategory;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1 Admin
        User::create([
            'name' => 'Admin System',
            'email' => 'admin@library.com',
            'password' => Hash::make('password'),
            'phone' => '0987654320',
            'address' => 'Hà Nội',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $this->command->info('Admin created');

        // 2 Librarians
        for ($i = 1; $i <= 2; $i++) {
            $librarian = User::create([
                'name' => 'Thủ thư ' . $i,
                'email' => 'librarian' . $i . '@library.com',
                'password' => Hash::make('password'),
                'phone' => '098765432' . $i,
                'role' => 'librarian',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            RolePermission::create([
                'librarian_id' => $librarian->id,
                'can_approve_ebook' => true,
                'can_manage_finance' => true,
                'can_manage_users' => true,
                'can_manage_books' => true,
                'can_manage_borrow_offline' => true,
                'can_manage_reservations' => true,
                'can_mark_lost_books' => true,
                'can_view_reports' => true,
                'can_manage_hot_books' => true,
                'can_manage_messages' => true,
            ]);
        }
        $this->command->info('2 Librarians created');

        // 2 Authors
        for ($i = 1; $i <= 2; $i++) {
            User::create([
                'name' => 'Tác giả ' . $i,
                'email' => 'author' . $i . '@library.com',
                'password' => Hash::make('password'),
                'phone' => '091234567' . $i,
                'role' => 'author',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
        }
        $this->command->info('2 Authors created');

        // 2 Users
        for ($i = 1; $i <= 2; $i++) {
            User::create([
                'name' => 'Người đọc ' . $i,
                'email' => 'user' . $i . '@library.com',
                'password' => Hash::make('password'),
                'phone' => '092345678' . $i,
                'role' => 'user',
                'status' => 'active',
                'balance' => 1000000,
                'email_verified_at' => now(),
            ]);
        }
        $this->command->info('2 Users created');

        // Categories
        $categories = [
            ['name' => 'Lập trình', 'slug' => 'lap-trinh'],
            ['name' => 'Khoa học', 'slug' => 'khoa-hoc'],
            ['name' => 'Văn học', 'slug' => 'van-hoc'],
            ['name' => 'Kinh tế', 'slug' => 'kinh-te'],
            ['name' => 'Tâm lý', 'slug' => 'tam-ly'],
            ['name' => 'Lịch sử', 'slug' => 'lich-su'],
            ['name' => 'Viễn tưởng', 'slug' => 'vien-tuong'],
            ['name' => 'Khoa học viễn tưởng', 'slug' => 'khoa-hoc-vien-tuong'],
            ['name' => 'Huyền bí', 'slug' => 'huyen-bi'],
            ['name' => 'Giáo trình', 'slug' => 'giao-trinh'],
        ];

        foreach ($categories as $category) {
            BookCategory::create($category);
        }
        $this->command->info('Categories created');

        $this->call([
            TestDataSeeder::class,
        ]);
    }
}
