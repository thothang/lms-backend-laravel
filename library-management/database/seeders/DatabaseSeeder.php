<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\BookCategory;
use App\Models\RolePermission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@library.com',
            'password' => Hash::make('password'),
            'phone' => '0987654321',
            'address' => 'Hà Nội',
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Create Librarian User
        $librarian = User::create([
            'name' => 'Thủ thư',
            'email' => 'librarian@library.com',
            'password' => Hash::make('password'),
            'phone' => '0987654322',
            'role' => 'librarian',
            'status' => 'active',
        ]);

        // Create permissions for librarian (all enabled)
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

        // Create Test User
        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'phone' => '0987654323',
            'address' => 'TP HCM',
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->command->info('Test User login: user@example.com / password');

        // Create Book Categories
        $categories = [
            ['name' => 'Lập trình', 'slug' => 'lap-trinh'],
            ['name' => 'Khoa học', 'slug' => 'khoa-hoc'],
            ['name' => 'Văn học', 'slug' => 'van-hoc'],
            ['name' => 'Kinh tế', 'slug' => 'kinh-te'],
            ['name' => 'Tâm lý', 'slug' => 'tam-ly'],
            ['name' => 'Lịch sử', 'slug' => 'lich-su'],
        ];

        foreach ($categories as $category) {
            BookCategory::create($category);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin login: admin@library.com / password');
        $this->command->info('Librarian login: librarian@library.com / password');

        // Call TestDataSeeder
        $this->call([
            TestDataSeeder::class,
        ]);
    }
}
