<?php

namespace Database\Seeders\Visual;

use App\Enums\UserRole;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoachVisualSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coach = User::query()->updateOrCreate(
            ['email' => 'coach.visual@endure.test'],
            [
                'name' => 'Coach Visual',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Coach,
            ],
        );

        CoachProfile::query()->updateOrCreate(
            ['user_id' => $coach->id],
            ['is_approved' => true],
        );
    }
}
