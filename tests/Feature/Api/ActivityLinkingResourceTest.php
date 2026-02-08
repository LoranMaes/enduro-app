<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('includes suggested activities in the training session resource', function () {
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-04-01',
        'ends_at' => '2026-04-07',
    ]);

    $session = TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-04-03',
        'sport' => 'bike',
        'duration_minutes' => 90,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'bike',
        'started_at' => '2026-04-03 07:00:00',
        'duration_seconds' => 5400,
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions/{$session->id}");

    $response
        ->assertOk()
        ->assertJsonPath('data.suggested_activities.0.id', $activity->id)
        ->assertJsonPath('data.suggested_activities.0.duration_seconds', 5400)
        ->assertJsonPath('data.suggested_activities.0.started_at', '2026-04-03T07:00:00.000000Z');
});

it('includes linked session identifiers in the activity resource', function () {
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-05-01',
        'ends_at' => '2026-05-07',
    ]);

    $session = TrainingSession::factory()->for($week)->create();

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson("/api/activities/{$activity->id}");

    $response
        ->assertOk()
        ->assertJsonPath('data.linked_session_id', $session->id)
        ->assertJsonPath('data.linked_session_uid', (string) $session->id)
        ->assertJsonPath('data.linked_session_summary.id', $session->id)
        ->assertJsonPath('data.linked_session_summary.sport', $session->sport)
        ->assertJsonPath('data.linked_session_summary.scheduled_date', $session->scheduled_date?->toDateString());
});
