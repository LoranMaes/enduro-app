<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Activity>
     */
    protected $model = Activity::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'training_session_id' => null,
            'athlete_id' => User::factory()->athlete(),
            'provider' => 'strava',
            'external_id' => (string) fake()->unique()->numberBetween(100000, 999999),
            'sport' => fake()->randomElement(['swim', 'bike', 'run', 'gym', 'other']),
            'started_at' => fake()->dateTimeBetween('-10 days', 'now'),
            'duration_seconds' => fake()->numberBetween(600, 10800),
            'distance_meters' => fake()->optional()->randomFloat(2, 500, 120000),
            'elevation_gain_meters' => fake()->optional()->randomFloat(2, 0, 3000),
            'raw_payload' => null,
        ];
    }

    public function linkedToTrainingSession(TrainingSession $trainingSession): static
    {
        return $this->state(fn (): array => [
            'training_session_id' => $trainingSession->id,
        ]);
    }
}
