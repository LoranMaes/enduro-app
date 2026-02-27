<?php

namespace Database\Factories;

use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AthleteWeekMetric>
 */
class AthleteWeekMetricFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $weekStart = CarbonImmutable::instance(fake()->dateTimeBetween('-3 months', '+3 months'))
            ->startOfWeek(CarbonInterface::MONDAY);
        $plannedSessionsCount = fake()->numberBetween(0, 7);

        return [
            'user_id' => User::factory()->athlete(),
            'week_start_date' => $weekStart->toDateString(),
            'week_end_date' => $weekStart->addDays(6)->toDateString(),
            'planned_sessions_count' => $plannedSessionsCount,
            'planned_completed_count' => fake()->numberBetween(0, $plannedSessionsCount),
            'planned_minutes_total' => fake()->numberBetween(0, 900),
            'completed_minutes_total' => fake()->numberBetween(0, 900),
            'planned_tss_total' => fake()->numberBetween(0, 900),
            'completed_tss_total' => fake()->numberBetween(0, 900),
            'load_state' => fake()->randomElement([
                'low',
                'in_range',
                'high',
                'insufficient',
            ]),
            'load_state_ratio' => fake()->optional()->randomFloat(3, 0.5, 1.6),
            'load_state_source' => 'planned_completed_tss_ratio',
        ];
    }
}
