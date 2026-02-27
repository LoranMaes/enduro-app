<?php

use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia;

it('locks atp access for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->get('/atp/2026')
        ->assertSuccessful()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('atp/index')
            ->where('isLocked', true));

    $this
        ->actingAs($athlete)
        ->patchJson('/api/atp/2026/weeks/2026-01-05', [
            'week_type' => 'base',
            'priority' => 'normal',
        ])
        ->assertForbidden();
});

it('locks activity streams and workout library for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
    ]);

    $this
        ->actingAs($athlete)
        ->getJson("/api/activities/{$activity->getRouteKey()}/streams")
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->getJson('/api/workout-library')
        ->assertForbidden();
});

it('allows workout library for paid athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => true,
        'stripe_subscription_status' => 'active',
    ]);

    $this
        ->actingAs($athlete)
        ->getJson('/api/workout-library')
        ->assertSuccessful();
});

it('blocks structured workout saves for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => null,
            'date' => CarbonImmutable::today()->toDateString(),
            'sport' => 'run',
            'planned_duration_minutes' => 60,
            'planned_tss' => 55,
            'planned_structure' => [
                'unit' => 'rpe',
                'mode' => 'target',
                'steps' => [
                    [
                        'id' => 'step-1',
                        'type' => 'active',
                        'duration_minutes' => 60,
                        'target' => 6,
                        'range_min' => null,
                        'range_max' => null,
                        'repeat_count' => 1,
                        'note' => null,
                        'items' => null,
                    ],
                ],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'planned_structure',
        ]);
});

it('limits progress range to four weeks for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->get('/progress?weeks=12')
        ->assertSuccessful()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('range.weeks', 4)
            ->where('range.options', [4]));
});

it('clamps calendar session history depth for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    $oldSession = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => CarbonImmutable::today()->subWeeks(20)->toDateString(),
        'sport' => 'run',
        'status' => TrainingSessionStatus::Planned->value,
        'planning_source' => 'planned',
        'duration_minutes' => 45,
        'planned_tss' => 50,
    ]);
    $recentSession = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => CarbonImmutable::today()->subWeeks(2)->toDateString(),
        'sport' => 'run',
        'status' => TrainingSessionStatus::Planned->value,
        'planning_source' => 'planned',
        'duration_minutes' => 45,
        'planned_tss' => 50,
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/training-sessions?from=2020-01-01&to=2030-01-01')
        ->assertSuccessful();

    /** @var list<string|int> $sessionIds */
    $sessionIds = collect((array) $response->json('data'))
        ->pluck('id')
        ->values()
        ->all();

    expect($sessionIds)->toContain($recentSession->getRouteKey());
    expect($sessionIds)->not->toContain($oldSession->getRouteKey());
});
