<?php

namespace Database\Factories;

use App\Models\TrainingPlan;
use App\Models\TrainingWeek;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TrainingWeek>
 */
class TrainingWeekFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\TrainingWeek>
     */
    protected $model = TrainingWeek::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'training_plan_id' => TrainingPlan::factory(),
            'starts_at' => fake()->dateTimeBetween('-1 month', '+2 months'),
        ];
    }
}
