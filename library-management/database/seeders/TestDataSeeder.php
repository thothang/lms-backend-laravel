<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookCopy;
use App\Models\Ebook;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $category = BookCategory::first();

        // Create Author user if not exists
        $author = User::firstOrCreate(
            ['email' => 'author@example.com'],
            [
                'name' => 'Test Author',
                'password' => bcrypt('password'),
                'role' => 'author',
                'status' => 'active',
            ]
        );

        // Create test book
        $book = Book::create([
            'title' => 'Lập trình PHP Laravel',
            'author_name' => 'Test Author',
            'category_id' => $category->id,
            'publisher' => 'Nhà xuất bản Test',
            'description' => 'Sách học PHP Laravel từ cơ bản đến nâng cao',
            'price' => 100000,
            'daily_fee' => 5000,
            'total_copies' => 5,
            'available_copies' => 5,
            'is_featured' => true,
        ]);

        // Create book copies
        for ($i = 1; $i <= 5; $i++) {
            BookCopy::create([
                'book_id' => $book->id,
                'barcode' => 'BK' . str_pad($book->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'status' => 'available',
            ]);
        }

        // Create test ebook
        Ebook::create([
            'title' => 'Ebook PHP Laravel Nang cao',
            'author_id' => $author->id,
            'description' => 'Ebook hoc PHP Laravel nang cao',
            'price' => 50000,
            'is_free' => false,
            'file_path' => '/test/ebook.pdf',
            'status' => 'approved',
        ]);

        $this->command->info('Test data seeded!');
        $this->command->info("Book ID: {$book->id}");
        $this->command->info("Book Copy 1 ID: " . $book->copies()->first()->id);
        $this->command->info("Ebook ID: " . Ebook::where('title', 'LIKE', '%Nâng cao%')->first()->id);
    }
}
