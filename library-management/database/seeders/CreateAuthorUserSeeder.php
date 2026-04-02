<?php

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CreateAuthorUserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $author = User::firstOrCreate(
            ['email' => 'author@example.com'],
            [
                'name' => 'Test Author',
                'password' => Hash::make('password'),
                'role' => 'author',
                'status' => 'active',
            ]
        );

        $this->command->info('Author user: author@example.com / password');
    }
}
