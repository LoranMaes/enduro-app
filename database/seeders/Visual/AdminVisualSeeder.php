<?php

namespace Database\Seeders\Visual;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminVisualSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        [$firstName, $lastName] = $this->splitName('Admin Visual');

        User::query()->updateOrCreate(
            ['email' => 'admin.visual@endure.test'],
            [
                'name' => 'Admin Visual',
                'first_name' => $firstName,
                'last_name' => $lastName,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Admin,
            ],
        );
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $firstName = $parts[0] ?? $name;
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';

        return [$firstName, $lastName];
    }
}
