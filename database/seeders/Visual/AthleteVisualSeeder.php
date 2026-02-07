<?php

namespace Database\Seeders\Visual;

use App\Enums\TrainingSessionStatus;
use App\Enums\UserRole;
use App\Models\AthleteProfile;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AthleteVisualSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Rebuilds training plans only for the dedicated visual athlete account to keep
     * deterministic, repeatable calendar data without touching unrelated users.
     */
    public function run(): void
    {
        $athlete = User::query()->updateOrCreate(
            ['email' => 'athlete.visual@endure.test'],
            [
                'name' => 'Athlete Visual',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Athlete,
            ],
        );

        AthleteProfile::query()->updateOrCreate(
            ['user_id' => $athlete->id],
            [
                'birthdate' => '1992-07-14',
                'weight' => 71.2,
                'height' => 178.0,
            ],
        );

        TrainingPlan::query()
            ->where('user_id', $athlete->id)
            ->delete();

        $today = CarbonImmutable::today();
        $currentWeekStart = $today->startOfWeek();

        $pastPlan = TrainingPlan::query()->create([
            'user_id' => $athlete->id,
            'title' => 'Base Block - Prior Cycle',
            'description' => 'Completed baseline build block for visual history.',
            'starts_at' => $currentWeekStart->subWeeks(10),
            'ends_at' => $currentWeekStart->subWeeks(5)->subDay(),
        ]);

        TrainingWeek::query()->create([
            'training_plan_id' => $pastPlan->id,
            'starts_at' => $currentWeekStart->subWeeks(10),
            'ends_at' => $currentWeekStart->subWeeks(9)->subDay(),
        ]);

        $activePlan = TrainingPlan::query()->create([
            'user_id' => $athlete->id,
            'title' => 'Build Toward Spring Event',
            'description' => 'Current progression block used for calendar layout verification.',
            'starts_at' => $currentWeekStart->subWeek(),
            'ends_at' => $currentWeekStart->addWeeks(3)->subDay(),
        ]);

        $heavyWeek = TrainingWeek::query()->create([
            'training_plan_id' => $activePlan->id,
            'starts_at' => $currentWeekStart->subWeek(),
            'ends_at' => $currentWeekStart->subDay(),
        ]);

        $lightWeek = TrainingWeek::query()->create([
            'training_plan_id' => $activePlan->id,
            'starts_at' => $currentWeekStart,
            'ends_at' => $currentWeekStart->addWeek()->subDay(),
        ]);

        $balancedWeek = TrainingWeek::query()->create([
            'training_plan_id' => $activePlan->id,
            'starts_at' => $currentWeekStart->addWeek(),
            'ends_at' => $currentWeekStart->addWeeks(2)->subDay(),
        ]);

        TrainingWeek::query()->create([
            'training_plan_id' => $activePlan->id,
            'starts_at' => $currentWeekStart->addWeeks(2),
            'ends_at' => $currentWeekStart->addWeeks(3)->subDay(),
        ]);

        $futurePlan = TrainingPlan::query()->create([
            'user_id' => $athlete->id,
            'title' => 'Future Race Preparation',
            'description' => 'Reserved plan shell for upcoming cycle.',
            'starts_at' => $currentWeekStart->addWeeks(6),
            'ends_at' => $currentWeekStart->addWeeks(10)->subDay(),
        ]);

        TrainingWeek::query()->create([
            'training_plan_id' => $futurePlan->id,
            'starts_at' => $currentWeekStart->addWeeks(6),
            'ends_at' => $currentWeekStart->addWeeks(7)->subDay(),
        ]);

        $this->seedHeavyWeekSessions($heavyWeek);
        $this->seedLightWeekSessions($lightWeek);
        $this->seedBalancedWeekSessions($balancedWeek);
    }

    private function seedHeavyWeekSessions(TrainingWeek $trainingWeek): void
    {
        $start = CarbonImmutable::parse($trainingWeek->starts_at->toDateString());

        $sessions = [
            ['scheduled_date' => $start->addDay(), 'sport' => 'swim', 'duration_minutes' => 60, 'notes' => 'Technique + aerobic pulls'],
            ['scheduled_date' => $start->addDays(2), 'sport' => 'bike', 'duration_minutes' => 90, 'notes' => 'Steady endurance ride'],
            ['scheduled_date' => $start->addDays(3), 'sport' => 'run', 'duration_minutes' => 60, 'notes' => 'Tempo intervals'],
            ['scheduled_date' => $start->addDays(5), 'sport' => 'bike', 'duration_minutes' => 90, 'notes' => 'Long progression set'],
            ['scheduled_date' => $start->addDays(6), 'sport' => 'run', 'duration_minutes' => 90, 'notes' => 'Long easy run'],
        ];

        $this->createPlannedSessions($trainingWeek, $sessions);
    }

    private function seedLightWeekSessions(TrainingWeek $trainingWeek): void
    {
        $start = CarbonImmutable::parse($trainingWeek->starts_at->toDateString());

        $sessions = [
            ['scheduled_date' => $start->addDay(), 'sport' => 'swim', 'duration_minutes' => 30, 'notes' => 'Recovery mobility session'],
            ['scheduled_date' => $start->addDays(3), 'sport' => 'bike', 'duration_minutes' => 60, 'notes' => 'Low-intensity spin'],
            ['scheduled_date' => $start->addDays(5), 'sport' => 'run', 'duration_minutes' => 30, 'notes' => 'Easy cadence drills'],
        ];

        $this->createPlannedSessions($trainingWeek, $sessions);
    }

    private function seedBalancedWeekSessions(TrainingWeek $trainingWeek): void
    {
        $start = CarbonImmutable::parse($trainingWeek->starts_at->toDateString());

        $sessions = [
            ['scheduled_date' => $start, 'sport' => 'swim', 'duration_minutes' => 60, 'notes' => 'Aerobic swim + form focus'],
            ['scheduled_date' => $start->addDays(2), 'sport' => 'run', 'duration_minutes' => 60, 'notes' => 'Steady endurance run'],
            ['scheduled_date' => $start->addDays(4), 'sport' => 'bike', 'duration_minutes' => 90, 'notes' => 'Sweet spot intervals'],
            ['scheduled_date' => $start->addDays(6), 'sport' => 'run', 'duration_minutes' => 60, 'notes' => 'Negative split run'],
        ];

        $this->createPlannedSessions($trainingWeek, $sessions);
    }

    /**
     * @param  list<array{scheduled_date: CarbonImmutable, sport: string, duration_minutes: int, notes: string}>  $sessions
     */
    private function createPlannedSessions(TrainingWeek $trainingWeek, array $sessions): void
    {
        foreach ($sessions as $session) {
            TrainingSession::query()->create([
                'training_week_id' => $trainingWeek->id,
                'scheduled_date' => $session['scheduled_date'],
                'sport' => $session['sport'],
                'status' => TrainingSessionStatus::Planned,
                'duration_minutes' => $session['duration_minutes'],
                'planned_tss' => null,
                'actual_tss' => null,
                'notes' => $session['notes'],
            ]);
        }
    }
}
