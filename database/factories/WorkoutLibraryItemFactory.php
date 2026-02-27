<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkoutLibraryItem>
 */
class WorkoutLibraryItemFactory extends Factory
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
            'title' => fake()->sentence(3),
            'sport' => 'run',
            'structure_json' => [
                'unit' => 'rpe',
                'mode' => 'target',
                'steps' => [
                    [
                        'id' => 'step-1',
                        'type' => 'active',
                        'duration_minutes' => 20,
                        'target' => 7,
                    ],
                ],
            ],
            'estimated_duration_minutes' => 20,
            'estimated_tss' => 82,
            'tags' => ['tempo'],
        ];
    }
}
