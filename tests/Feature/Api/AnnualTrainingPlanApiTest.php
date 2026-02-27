<?php

use App\Enums\TrainingSessionPlanningSource;
use App\Models\Activity;
use App\Models\AnnualTrainingPlan;
use App\Models\AnnualTrainingPlanWeek;
use App\Models\Goal;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

it('requires authentication for annual training plan endpoint', function () {
    $this->getJson('/api/atp/2026')->assertUnauthorized();
});

it('creates and reuses athlete annual training plan skeleton by year', function () {
    $athlete = User::factory()->athlete()->create();

    $firstResponse = $this
        ->actingAs($athlete)
        ->getJson('/api/atp/2026')
        ->assertOk()
        ->assertJsonPath('data.year', 2026)
        ->assertJsonPath('data.user_id', $athlete->id);

    $secondResponse = $this
        ->actingAs($athlete)
        ->getJson('/api/atp/2026')
        ->assertOk();

    expect($secondResponse->json('data.id'))->toBe($firstResponse->json('data.id'));
    expect(AnnualTrainingPlan::query()->where('user_id', $athlete->id)->where('year', 2026)->count())
        ->toBe(1);
});

it('forbids direct admin and coach access to annual training plan endpoint', function () {
    $admin = User::factory()->admin()->create();
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/atp/2026')
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->getJson('/api/atp/2026')
        ->assertForbidden();
});

it('allows annual training plan access while impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->getJson('/api/atp/2027')
        ->assertOk()
        ->assertJsonPath('data.user_id', $athlete->id)
        ->assertJsonPath('data.year', 2027);
});

it('returns generated atp weeks with 52 or 53 rows for the requested year', function () {
    $athlete = User::factory()->athlete()->create();

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/atp/2026')
        ->assertOk();

    $weeks = $response->json('data.weeks');

    expect($weeks)->toBeArray();
    expect(count($weeks))->toBeGreaterThanOrEqual(52);
    expect(count($weeks))->toBeLessThanOrEqual(53);
    expect($weeks[0])->toHaveKeys([
        'week_start_date',
        'week_end_date',
        'planned_minutes',
        'completed_minutes',
        'week_type',
        'priority',
    ]);
});

it('updates atp week metadata for athlete users', function () {
    $athlete = User::factory()->athlete()->create();

    $weekStart = CarbonImmutable::parse('2026-02-09')
        ->startOfWeek(CarbonInterface::MONDAY)
        ->toDateString();

    $this
        ->actingAs($athlete)
        ->patchJson("/api/atp/2026/weeks/{$weekStart}", [
            'week_type' => 'build',
            'priority' => 'high',
            'notes' => 'Race-specific build week',
        ])
        ->assertOk()
        ->assertJsonPath('data.week_start_date', $weekStart)
        ->assertJsonPath('data.week_type', 'build')
        ->assertJsonPath('data.priority', 'high')
        ->assertJsonPath('data.notes', 'Race-specific build week');

    $plan = AnnualTrainingPlan::query()
        ->where('user_id', $athlete->id)
        ->where('year', 2026)
        ->first();

    expect($plan)->not->toBeNull();

    expect(
        AnnualTrainingPlanWeek::query()
            ->where('annual_training_plan_id', $plan?->id)
            ->whereDate('week_start_date', $weekStart)
            ->value('priority'),
    )->toBe('high');
});

it('includes current week and goal marker metadata in the atp payload', function () {
    $athlete = User::factory()->athlete()->create();
    $year = (int) now()->year;
    $goalDate = CarbonImmutable::create($year, 6, 15)->toDateString();
    $goalWeekStart = CarbonImmutable::parse($goalDate)
        ->startOfWeek(CarbonInterface::MONDAY)
        ->toDateString();

    Goal::factory()->create([
        'user_id' => $athlete->id,
        'title' => 'A Race Goal',
        'target_date' => $goalDate,
        'priority' => 'high',
        'status' => 'active',
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson("/api/atp/{$year}")
        ->assertOk()
        ->json('data.weeks');

    expect($response)->toBeArray();

    $currentWeeks = collect($response)->filter(
        fn (array $week): bool => (bool) ($week['is_current_week'] ?? false),
    );

    expect($currentWeeks->count())->toBe(1);

    $goalWeek = collect($response)->first(
        fn (array $week): bool => ($week['week_start_date'] ?? null) === $goalWeekStart,
    );

    expect($goalWeek)->toBeArray();
    expect($goalWeek['goal_marker'])->not->toBeNull();
    expect($goalWeek['goal_marker']['title'])->toBe('A Race Goal');
    expect($goalWeek['load_state'])->toBeString();
});

it('only counts planned sessions in planned metrics and includes unplanned sessions in completed totals', function () {
    $athlete = User::factory()->athlete()->create();
    $weekStart = CarbonImmutable::parse('2026-02-09')
        ->startOfWeek(CarbonInterface::MONDAY)
        ->toDateString();
    $scheduledDate = CarbonImmutable::parse($weekStart)->addDay()->toDateString();
    $completedAt = CarbonImmutable::parse('2026-02-10 08:00:00');

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => $scheduledDate,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'duration_minutes' => 60,
        'planned_tss' => 40,
        'status' => 'planned',
        'completed_at' => null,
        'actual_duration_minutes' => null,
        'actual_tss' => null,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => CarbonImmutable::parse($scheduledDate)->addDay()->toDateString(),
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'duration_minutes' => 75,
        'planned_tss' => 65,
        'status' => 'completed',
        'completed_at' => $completedAt,
        'actual_duration_minutes' => 80,
        'actual_tss' => 72,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => CarbonImmutable::parse($scheduledDate)->addDays(2)->toDateString(),
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'duration_minutes' => 30,
        'planned_tss' => 20,
        'status' => 'completed',
        'completed_at' => $completedAt->addHour(),
        'actual_duration_minutes' => 35,
        'actual_tss' => 28,
    ]);

    $resolvedByActivitySession = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => CarbonImmutable::parse($scheduledDate)->addDays(3)->toDateString(),
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'duration_minutes' => 50,
        'planned_tss' => 30,
        'status' => 'completed',
        'completed_at' => $completedAt->addHours(2),
        'actual_duration_minutes' => 50,
        'actual_tss' => null,
    ]);

    Activity::factory()
        ->linkedToTrainingSession($resolvedByActivitySession)
        ->create([
            'athlete_id' => $athlete->id,
            'provider' => 'strava',
            'sport' => 'run',
            'duration_seconds' => 3000,
            'raw_payload' => [
                'relative_effort' => 45,
            ],
        ]);

    $week = collect(
        $this
            ->actingAs($athlete)
            ->getJson('/api/atp/2026')
            ->assertOk()
            ->json('data.weeks'),
    )->first(
        fn (array $item): bool => ($item['week_start_date'] ?? null) === $weekStart,
    );

    expect($week)->toBeArray();
    expect($week['planned_minutes'])->toBe(135);
    expect($week['planned_tss'])->toBe(105);
    expect($week['completed_minutes'])->toBe(165);
    expect($week['completed_tss'])->toBe(145);
});

it('includes actual-based recommendation state in atp payload weeks', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-20 10:00:00'));

    try {
        $athlete = User::factory()->athlete()->create();
        $targetWeekStart = CarbonImmutable::parse('2026-03-02')
            ->startOfWeek(CarbonInterface::MONDAY);

        foreach ([4, 3, 2, 1] as $offsetWeeks) {
            TrainingSession::factory()->create([
                'user_id' => $athlete->id,
                'training_week_id' => null,
                'scheduled_date' => $targetWeekStart->subWeeks($offsetWeeks)->addDay()->toDateString(),
                'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
                'duration_minutes' => 60,
                'status' => 'completed',
                'completed_at' => $targetWeekStart->subWeeks($offsetWeeks)->addDay()->setTime(8, 0),
                'actual_duration_minutes' => 60,
                'actual_tss' => 100,
            ]);
        }

        TrainingSession::factory()->create([
            'user_id' => $athlete->id,
            'training_week_id' => null,
            'scheduled_date' => $targetWeekStart->addDay()->toDateString(),
            'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
            'duration_minutes' => 55,
            'status' => 'completed',
            'completed_at' => $targetWeekStart->addDay()->setTime(9, 0),
            'actual_duration_minutes' => 55,
            'actual_tss' => 95,
        ]);

        $week = collect(
            $this
                ->actingAs($athlete)
                ->getJson('/api/atp/2026')
                ->assertOk()
                ->json('data.weeks'),
        )->first(
            fn (array $item): bool => ($item['week_start_date'] ?? null) === $targetWeekStart->toDateString(),
        );

        expect($week)->toBeArray();
        expect($week['recommended_tss_source'])->toBe('actual_tss_trailing_4w');
        expect($week['recommended_tss_state'])->toBe('in_range');
    } finally {
        CarbonImmutable::setTestNow();
    }
});

it('uses prior-year history for the first atp week recommendation', function () {
    $athlete = User::factory()->athlete()->create();
    $firstWeekStart = CarbonImmutable::parse('2025-12-29')
        ->startOfWeek(CarbonInterface::MONDAY);

    foreach ([4, 3, 2, 1] as $offsetWeeks) {
        TrainingSession::factory()->create([
            'user_id' => $athlete->id,
            'training_week_id' => null,
            'scheduled_date' => $firstWeekStart->subWeeks($offsetWeeks)->addDay()->toDateString(),
            'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
            'duration_minutes' => 60,
            'status' => 'completed',
            'completed_at' => $firstWeekStart->subWeeks($offsetWeeks)->addDay()->setTime(8, 0),
            'actual_duration_minutes' => 60,
            'actual_tss' => 100,
        ]);
    }

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => $firstWeekStart->addDay()->toDateString(),
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'duration_minutes' => 55,
        'status' => 'completed',
        'completed_at' => $firstWeekStart->addDay()->setTime(9, 0),
        'actual_duration_minutes' => 55,
        'actual_tss' => 95,
    ]);

    $week = collect(
        $this
            ->actingAs($athlete)
            ->getJson('/api/atp/2026')
            ->assertOk()
            ->json('data.weeks'),
    )->first(
        fn (array $item): bool => ($item['week_start_date'] ?? null) === $firstWeekStart->toDateString(),
    );

    expect($week)->toBeArray();
    expect($week['recommended_tss_source'])->toBe('actual_tss_trailing_4w');
    expect($week['recommended_tss_state'])->toBe('in_range');
});

it('marks future atp weeks as insufficient recommendation state', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-02-11 10:00:00'));

    try {
        $athlete = User::factory()->athlete()->create();
        $currentWeekStart = CarbonImmutable::now()->startOfWeek(CarbonInterface::MONDAY);
        $futureWeekStart = $currentWeekStart->addWeek();

        foreach ([4, 3, 2, 1] as $offsetWeeks) {
            TrainingSession::factory()->create([
                'user_id' => $athlete->id,
                'training_week_id' => null,
                'scheduled_date' => $currentWeekStart->subWeeks($offsetWeeks)->addDay()->toDateString(),
                'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
                'duration_minutes' => 60,
                'status' => 'completed',
                'completed_at' => $currentWeekStart->subWeeks($offsetWeeks)->addDay()->setTime(8, 0),
                'actual_duration_minutes' => 60,
                'actual_tss' => 100,
            ]);
        }

        TrainingSession::factory()->create([
            'user_id' => $athlete->id,
            'training_week_id' => null,
            'scheduled_date' => $currentWeekStart->addDay()->toDateString(),
            'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
            'duration_minutes' => 60,
            'status' => 'completed',
            'completed_at' => $currentWeekStart->addDay()->setTime(9, 0),
            'actual_duration_minutes' => 60,
            'actual_tss' => 90,
        ]);

        $week = collect(
            $this
                ->actingAs($athlete)
                ->getJson('/api/atp/2026')
                ->assertOk()
                ->json('data.weeks'),
        )->first(
            fn (array $item): bool => ($item['week_start_date'] ?? null) === $futureWeekStart->toDateString(),
        );

        expect($week)->toBeArray();
        expect($week['recommended_tss_state'])->toBe('insufficient');
        expect($week['recommended_tss_source'])->toBe('actual_tss_trailing_4w');
    } finally {
        CarbonImmutable::setTestNow();
    }
});
