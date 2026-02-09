<?php

use App\Data\ExternalActivityDTO;
use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use App\Services\Activities\ActivityAutoLinkService;
use App\Services\Activities\ExternalActivityPersister;
use Carbon\CarbonImmutable;

it('auto-links matching unlinked activities to same-day same-sport sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-10',
        'sport' => 'run',
        'duration_minutes' => 60,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'provider' => 'strava',
        'sport' => 'run',
        'started_at' => '2026-02-10 09:00:00',
        'duration_seconds' => 3660,
    ]);

    $linkedCount = app(ActivityAutoLinkService::class)
        ->autoLinkRecentActivities($athlete, 'strava');

    expect($linkedCount)->toBe(1);
    expect($activity->refresh()->training_session_id)->toBe($session->id);
});

it('does not auto-link activities that do not belong to the athlete', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-10',
        'sport' => 'bike',
        'duration_minutes' => 90,
    ]);

    $otherActivity = Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'training_session_id' => null,
        'provider' => 'strava',
        'sport' => 'bike',
        'started_at' => '2026-02-10 08:00:00',
        'duration_seconds' => 5400,
    ]);

    $linkedCount = app(ActivityAutoLinkService::class)
        ->autoLinkRecentActivities($athlete, 'strava');

    expect($linkedCount)->toBe(0);
    expect($otherActivity->refresh()->training_session_id)->toBeNull();
});

it('does not auto-link when activity duration differs too much', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-10',
        'sport' => 'run',
        'duration_minutes' => 45,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'provider' => 'strava',
        'sport' => 'run',
        'started_at' => '2026-02-10 08:00:00',
        'duration_seconds' => 4 * 60 * 60,
    ]);

    $linkedCount = app(ActivityAutoLinkService::class)
        ->autoLinkRecentActivities($athlete, 'strava');

    expect($linkedCount)->toBe(0);
    expect($activity->refresh()->training_session_id)->toBeNull();
});

it('preserves an existing activity-session link during provider upserts', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-10',
        'sport' => 'bike',
    ]);

    $existingActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'provider' => 'strava',
        'external_id' => 'strava-12345',
        'sport' => 'bike',
        'started_at' => '2026-02-10 08:00:00',
        'duration_seconds' => 3200,
    ]);

    $dto = new ExternalActivityDTO(
        provider: 'strava',
        external_id: 'strava-12345',
        sport: 'bike',
        started_at: CarbonImmutable::parse('2026-02-10 08:00:00'),
        duration_seconds: 3600,
        distance_meters: 30000,
        elevation_gain_meters: 500,
        raw_payload: ['name' => 'Morning Ride'],
    );

    $persistedActivity = app(ExternalActivityPersister::class)
        ->persist($athlete, $dto);

    expect($persistedActivity->id)->toBe($existingActivity->id);
    expect($persistedActivity->refresh()->training_session_id)->toBe($session->id);
});
