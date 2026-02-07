<?php

namespace Database\Factories;

use App\Enums\TrainingSessionStatus;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TrainingSession>
 */
class TrainingSessionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\TrainingSession>
     */
    protected $model = TrainingSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'training_week_id' => TrainingWeek::factory(),
            'scheduled_date' => fake()->dateTimeBetween('-2 weeks', '+2 weeks'),
            'sport' => fake()->randomElement(['swim', 'bike', 'run', 'gym']),
            'status' => fake()->randomElement([
                TrainingSessionStatus::Planned->value,
                TrainingSessionStatus::Completed->value,
                TrainingSessionStatus::Skipped->value,
                TrainingSessionStatus::Partial->value,
            ]),
            'duration_minutes' => fake()->numberBetween(30, 240),
            'planned_tss' => fake()->optional()->numberBetween(20, 300),
            'actual_tss' => fake()->optional()->numberBetween(20, 300),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
