<?php

namespace Database\Factories;

use App\Models\AnnualTrainingPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AnnualTrainingPlanWeek>
 */
class AnnualTrainingPlanWeekFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'annual_training_plan_id' => AnnualTrainingPlan::factory(),
            'week_start_date' => now()->startOfWeek()->toDateString(),
            'week_type' => 'build',
            'priority' => 'normal',
            'notes' => null,
            'planned_minutes' => 0,
            'completed_minutes' => 0,
            'planned_tss' => null,
            'completed_tss' => null,
        ];
    }
}
