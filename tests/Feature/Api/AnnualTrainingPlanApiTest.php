<?php

use App\Models\AnnualTrainingPlan;
use App\Models\AnnualTrainingPlanWeek;
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
