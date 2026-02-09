<?php

namespace Database\Seeders\Visual;

use App\Enums\UserRole;
use App\Models\CoachAthleteAssignment;
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
        [$firstName, $lastName] = $this->splitName('Coach Visual');

        $coach = User::query()->updateOrCreate(
            ['email' => 'coach.visual@endure.test'],
            [
                'name' => 'Coach Visual',
                'first_name' => $firstName,
                'last_name' => $lastName,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Coach,
            ],
        );

        CoachProfile::query()->updateOrCreate(
            ['user_id' => $coach->id],
            ['is_approved' => true],
        );

        $athleteIds = User::query()
            ->whereIn('email', [
                'athlete.visual@endure.test',
                'athlete.alpha@endure.test',
                'athlete.bravo@endure.test',
            ])
            ->pluck('id');

        CoachAthleteAssignment::query()
            ->where('coach_id', $coach->id)
            ->whereNotIn('athlete_id', $athleteIds)
            ->delete();

        foreach ($athleteIds as $athleteId) {
            CoachAthleteAssignment::query()->updateOrCreate(
                [
                    'coach_id' => $coach->id,
                    'athlete_id' => $athleteId,
                ],
                [],
            );
        }
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
