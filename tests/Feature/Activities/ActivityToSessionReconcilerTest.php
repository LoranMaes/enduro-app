<?php

use App\Enums\TrainingSessionPlanningSource;
use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use App\Services\Training\ActivityToSessionReconciler;

it('auto links and auto completes a matching planned session', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-02-09',
        'ends_at' => '2026-02-15',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-10',
        'sport' => 'run',
        'status' => 'planned',
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'duration_minutes' => 60,
        'actual_duration_minutes' => null,
        'completed_at' => null,
        'completion_source' => null,
        'auto_completed_at' => null,
    ]);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-02-10 09:10:00',
        'duration_seconds' => 3600,
        'raw_payload' => ['tss' => 72],
    ]);

    $resolvedSession = app(ActivityToSessionReconciler::class)->reconcile($activity);

    expect($resolvedSession)->not->toBeNull();
    expect($resolvedSession?->id)->toBe($session->id);
    expect($activity->fresh()->training_session_id)->toBe($session->id);

    $session->refresh();
    expect($session->status->value)->toBe('completed');
    expect($session->planning_source->value)->toBe('planned');
    expect($session->completion_source?->value)->toBe('provider_auto');
    expect($session->completed_at)->not->toBeNull();
    expect($session->auto_completed_at)->not->toBeNull();
});

it('creates a completed unplanned session when no match exists', function () {
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'bike',
        'started_at' => '2026-02-12 07:45:00',
        'duration_seconds' => 5400,
        'raw_payload' => ['relative_effort' => 65],
    ]);

    $resolvedSession = app(ActivityToSessionReconciler::class)->reconcile($activity);

    expect($resolvedSession)->toBeInstanceOf(TrainingSession::class);
    expect($resolvedSession?->user_id)->toBe($athlete->id);
    expect($resolvedSession?->training_week_id)->toBeNull();
    expect($resolvedSession?->planning_source->value)->toBe('unplanned');
    expect($resolvedSession?->status->value)->toBe('completed');
    expect($resolvedSession?->completion_source?->value)->toBe('provider_auto');
    expect($resolvedSession?->title)->toBe('Free Workout');
    expect($resolvedSession?->notes)->toBe('Free Workout');
    expect($resolvedSession?->completed_at)->not->toBeNull();
    expect($resolvedSession?->auto_completed_at)->not->toBeNull();
    expect($activity->fresh()->training_session_id)->toBe($resolvedSession?->id);
});

it('is idempotent when the same activity is reconciled repeatedly', function () {
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'walk',
        'started_at' => '2026-02-13 18:20:00',
        'duration_seconds' => 2400,
    ]);

    $reconciler = app(ActivityToSessionReconciler::class);

    $firstSession = $reconciler->reconcile($activity);
    $secondSession = $reconciler->reconcile($activity->fresh());

    expect($firstSession)->toBeInstanceOf(TrainingSession::class);
    expect($secondSession)->toBeInstanceOf(TrainingSession::class);
    expect($secondSession?->id)->toBe($firstSession?->id);
    expect($activity->fresh()->training_session_id)->toBe($firstSession?->id);

    $count = TrainingSession::query()
        ->where('user_id', $athlete->id)
        ->whereDate('scheduled_date', '2026-02-13')
        ->where('sport', 'walk')
        ->count();

    expect($count)->toBe(1);
});

it('links to the only planned session on a day even when duration differs significantly', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-02-09',
        'ends_at' => '2026-02-15',
    ]);
    $plannedSession = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-02-12',
        'sport' => 'run',
        'status' => 'planned',
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'duration_minutes' => 30,
        'completed_at' => null,
        'completion_source' => null,
        'auto_completed_at' => null,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-02-12 18:02:39',
        'duration_seconds' => 60,
    ]);

    $resolvedSession = app(ActivityToSessionReconciler::class)->reconcile($activity);

    expect($resolvedSession)->toBeInstanceOf(TrainingSession::class);
    expect($resolvedSession?->id)->toBe($plannedSession->id);
    expect($activity->fresh()->training_session_id)->toBe($plannedSession->id);

    $sessionCount = TrainingSession::query()
        ->where('user_id', $athlete->id)
        ->whereDate('scheduled_date', '2026-02-12')
        ->where('sport', 'run')
        ->count();

    expect($sessionCount)->toBe(1);
});
