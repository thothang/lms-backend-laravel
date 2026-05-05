<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookCopy;
use App\Models\Ebook;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('vi_VN');
        $categories = BookCategory::all();
        $authors = User::where('role', 'author')->get();

        // 1. Prepare 10 Images from Internet and upload to Supabase S3
        $this->command->info('Đang tải và đẩy 10 ảnh bìa lên Supabase Storage...');
        $supabaseImagePaths = [];
        for ($i = 1; $i <= 10; $i++) {
            // Using placeholder image generator for stable fast download
            // To ensure it doesn't fail due to SSL certs locally, we use file_get_contents with stream context
            $arrContextOptions = [
                "ssl" => [
                    "verify_peer" => false,
                    "verify_peer_name" => false,
                ],
            ];
            $imageData = @file_get_contents('https://picsum.photos/400/600?random=' . $i, false, stream_context_create($arrContextOptions));
            
            if (!$imageData) {
                // Fallback to placehold.co if picsum fails
                $imageData = @file_get_contents('https://placehold.co/400x600/png?text=Book+Cover+' . $i, false, stream_context_create($arrContextOptions));
            }

            $filename = 'covers/books/seed_' . time() . '_' . $i . '.jpg';
            
            // Upload to Supabase S3 bucket (public disk)
            Storage::disk('public')->put($filename, $imageData);
            
            $supabaseImagePaths[] = $filename;
            $this->command->info("- Đã đẩy ảnh {$i}/10 lên Supabase.");
        }

        // 2. Generate 100 Physical Books
        $this->command->info('Đang tạo 100 sách vật lý...');
        for ($i = 0; $i < 100; $i++) {
            $copyCount = rand(2, 6);
            $randomImagePath = $faker->randomElement($supabaseImagePaths);

            $book = Book::create([
                'title' => rtrim($faker->sentence(mt_rand(3, 7)), '.'),
                'author_name' => $faker->name,
                'category_id' => $categories->random()->id,
                'publisher' => 'NXB ' . $faker->company,
                'description' => $faker->realText(300),
                'cover_image' => $randomImagePath,
                'price' => $faker->randomElement([50000, 80000, 120000, 150000, 200000, 250000]),
                'daily_fee' => $faker->randomElement([2000, 3000, 5000, 7000]),
                'is_featured' => $faker->boolean(15),
                'is_hot' => $faker->boolean(20),
                'in_carousel' => $faker->boolean(10),
                'carousel_order' => $i,
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
        }
        $this->command->info('Đã tạo xong 100 sách vật lý!');

        // 3. Generate 100 Ebooks
        $this->command->info('Đang tạo 100 Ebook...');
        for ($i = 0; $i < 100; $i++) {
            $isFree = $faker->boolean(30); // 30% ebooks are free
            $randomImagePath = $faker->randomElement($supabaseImagePaths);
            $author = $authors->random();

            Ebook::create([
                'title' => ($isFree ? 'Free: ' : 'Premium: ') . rtrim($faker->sentence(mt_rand(3, 7)), '.'),
                'author_id' => $author->id,
                'category_id' => $categories->random()->id,
                'description' => $faker->realText(300),
                'cover_image' => str_replace('covers/books/', 'covers/ebooks/', $randomImagePath), // Store in ebooks path logically
                'price' => $isFree ? 0 : $faker->randomElement([49000, 79000, 99000, 129000]),
                'is_free' => $isFree,
                'file_path' => 'ebooks/sample.pdf', // Local PDF path fallback
                'status' => $faker->randomElement(['approved', 'approved', 'approved', 'pending']), // Mostly approved
                'free_preview_pages' => rand(5, 15),
            ]);
            
            // To ensure covers/ebooks works, copy the Supabase image directly 
            // Wait, we don't strictly need to copy since the accessor just resolves the path, 
            // but we can just use the exact $randomImagePath for ebooks too!
        }
        
        // Let's fix the Ebook image mapping quickly 
        Ebook::whereNotNull('id')->update([
            'cover_image' => \Illuminate\Support\Facades\DB::raw('(SELECT cover_image FROM books ORDER BY RANDOM() LIMIT 1)')
        ]);

        $this->command->info('Đã tạo xong 100 Ebook!');
        $this->command->info('Seed dữ liệu mới hoàn tất!');
    }
}
