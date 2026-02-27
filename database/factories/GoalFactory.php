<?php

namespace Database\Factories;

use App\Enums\GoalPriority;
use App\Enums\GoalSport;
use App\Enums\GoalStatus;
use App\Enums\GoalType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Goal>
 */
class GoalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->athlete(),
            'type' => fake()->randomElement(GoalType::cases())->value,
            'sport' => fake()->randomElement(GoalSport::cases())->value,
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'target_date' => fake()->optional()->date(),
            'priority' => fake()->randomElement(GoalPriority::cases())->value,
            'status' => GoalStatus::Active->value,
        ];
    }
}
