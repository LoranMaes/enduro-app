<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('allows athletes to copy their own activity into a planned session draft', function () {
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'run',
        'started_at' => '2026-03-02 07:15:00',
        'duration_seconds' => 3660,
        'raw_payload' => [
            'relative_effort' => 78,
        ],
    ]);

    $response = $this
        ->actingAs($athlete)
        ->postJson("/api/activities/{$activity->id}/copy")
        ->assertCreated()
        ->assertJsonPath('data.training_week_id', null)
        ->assertJsonPath('data.scheduled_date', '2026-03-02')
        ->assertJsonPath('data.sport', 'run')
        ->assertJsonPath('data.status', 'planned')
        ->assertJsonPath('data.planning_source', 'planned')
        ->assertJsonPath('data.linked_activity_id', null)
        ->assertJsonPath('data.duration_minutes', 61)
        ->assertJsonPath('data.planned_tss', 78)
        ->assertJsonPath('data.title', 'Copied activity');

    $this->assertDatabaseHas('training_sessions', [
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-03-02',
        'sport' => 'run',
        'status' => 'planned',
        'planning_source' => 'planned',
        'duration_minutes' => 61,
        'planned_tss' => 78,
        'title' => 'Copied activity',
    ]);
});

it('allows athletes to delete unlinked activities', function () {
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/activities/{$activity->id}")
        ->assertOk()
        ->assertJsonPath('status', 'deleted')
        ->assertJsonPath('linked_session_deleted', false);

    $this->assertSoftDeleted('activities', [
        'id' => $activity->id,
    ]);
});

it('deletes linked session when athlete deletes a linked activity', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForActivityAthlete($athlete, [
        'scheduled_date' => '2026-03-03',
        'sport' => 'bike',
    ]);
    $activity = Activity::factory()->linkedToTrainingSession($session)->create([
        'athlete_id' => $athlete->id,
        'sport' => 'bike',
        'started_at' => '2026-03-03 07:45:00',
    ]);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/activities/{$activity->id}")
        ->assertOk()
        ->assertJsonPath('linked_session_deleted', true);

    $this->assertSoftDeleted('activities', [
        'id' => $activity->id,
    ]);
    $this->assertDatabaseMissing('training_sessions', [
        'id' => $session->id,
    ]);
});

it('forbids coaches from copying or deleting athlete activities', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($coach)
        ->postJson("/api/activities/{$activity->id}/copy")
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->deleteJson("/api/activities/{$activity->id}")
        ->assertForbidden();
});

it('allows admins to copy and delete activities', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'started_at' => '2026-03-04 09:20:00',
        'duration_seconds' => 1800,
        'sport' => 'swim',
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/activities/{$activity->id}/copy")
        ->assertCreated()
        ->assertJsonPath('data.scheduled_date', '2026-03-04')
        ->assertJsonPath('data.sport', 'swim');

    $this
        ->actingAs($admin)
        ->deleteJson("/api/activities/{$activity->id}")
        ->assertOk()
        ->assertJsonPath('status', 'deleted');
});

it('keeps existing link and unlink activity flows working', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForActivityAthlete($athlete, [
        'scheduled_date' => '2026-03-05',
        'sport' => 'run',
    ]);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'started_at' => '2026-03-05 08:00:00',
        'sport' => 'run',
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertOk();

    $this->assertDatabaseHas('activities', [
        'id' => $activity->id,
        'training_session_id' => $session->id,
    ]);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertOk();

    $this->assertDatabaseHas('activities', [
        'id' => $activity->id,
        'training_session_id' => null,
    ]);
});

/**
 * @param  array<string, mixed>  $sessionOverrides
 */
function createSessionForActivityAthlete(
    User $athlete,
    array $sessionOverrides = [],
): TrainingSession {
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-03-02',
        'ends_at' => '2026-03-08',
    ]);

    return TrainingSession::factory()->for($week)->create($sessionOverrides);
}
