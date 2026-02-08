<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use App\Services\ActivityLinkingService;

it('includes same day same sport activities for the session athlete', function () {
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForAthlete($athlete, [
        'scheduled_date' => '2026-03-10',
        'sport' => 'run',
        'duration_minutes' => 60,
    ]);

    $matchingActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-03-10 07:00:00',
        'duration_seconds' => 3600,
    ]);

    $alreadyLinkedActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'sport' => 'run',
        'started_at' => '2026-03-10 08:00:00',
        'duration_seconds' => 3500,
    ]);

    $suggestions = app(ActivityLinkingService::class)
        ->suggestMatchesForSession($session);

    expect($suggestions->pluck('id')->all())
        ->toContain($matchingActivity->id)
        ->not->toContain($alreadyLinkedActivity->id);
});

it('excludes activities outside the scheduled date', function () {
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForAthlete($athlete, [
        'scheduled_date' => '2026-03-10',
        'sport' => 'bike',
        'duration_minutes' => 90,
    ]);

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'bike',
        'started_at' => '2026-03-11 07:00:00',
        'duration_seconds' => 5400,
    ]);

    $suggestions = app(ActivityLinkingService::class)
        ->suggestMatchesForSession($session);

    expect($suggestions)->toHaveCount(0);
});

it('excludes activities from other athletes', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $session = createSessionForAthlete($athlete, [
        'scheduled_date' => '2026-03-10',
        'sport' => 'swim',
        'duration_minutes' => 45,
    ]);

    Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'training_session_id' => null,
        'sport' => 'swim',
        'started_at' => '2026-03-10 06:30:00',
        'duration_seconds' => 2700,
    ]);

    $suggestions = app(ActivityLinkingService::class)
        ->suggestMatchesForSession($session);

    expect($suggestions)->toHaveCount(0);
});

it('orders suggestions by duration proximity', function () {
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForAthlete($athlete, [
        'scheduled_date' => '2026-03-10',
        'sport' => 'run',
        'duration_minutes' => 60,
    ]);

    $farDurationActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-03-10 06:00:00',
        'duration_seconds' => 9000,
    ]);

    $nearDurationActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-03-10 07:00:00',
        'duration_seconds' => 3660,
    ]);

    $suggestions = app(ActivityLinkingService::class)
        ->suggestMatchesForSession($session);

    expect($suggestions)->toHaveCount(2);
    expect($suggestions->first()?->id)->toBe($nearDurationActivity->id);
    expect($suggestions->pluck('id')->all())->toContain($farDurationActivity->id);
});

/**
 * @param  array<string, mixed>  $overrides
 */
function createSessionForAthlete(User $athlete, array $overrides = []): TrainingSession
{
    $plan = TrainingPlan::factory()->for($athlete)->create();

    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-03-10',
        'ends_at' => '2026-03-16',
    ]);

    return TrainingSession::factory()->for($week)->create($overrides);
}
