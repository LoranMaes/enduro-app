<?php

namespace Database\Factories;

use App\Models\TrainingPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TrainingPlan>
 */
class TrainingPlanFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\TrainingPlan>
     */
    protected $model = TrainingPlan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('now', '+2 months');

        return [
            'user_id' => User::factory()->athlete(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'starts_at' => $startsAt,
            'ends_at' => fake()->dateTimeBetween($startsAt, '+4 months'),
        ];
    }
}
