<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('requires authentication for session completion endpoints', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete);

    $this
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertUnauthorized();

    $this
        ->postJson("/api/training-sessions/{$session->id}/revert-completion")
        ->assertUnauthorized();
});

it('allows an athlete to complete a linked training session', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete, [
        'scheduled_date' => '2026-10-03',
        'sport' => 'run',
        'status' => 'planned',
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'sport' => 'run',
        'duration_seconds' => 3720,
        'raw_payload' => ['tss' => 74],
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertOk()
        ->assertJsonPath('data.status', 'completed')
        ->assertJsonPath('data.is_completed', true)
        ->assertJsonPath('data.actual_duration_minutes', 62)
        ->assertJsonPath('data.actual_tss', 74)
        ->assertJsonPath('data.linked_activity_id', $activity->id);

    $this->assertDatabaseHas('training_sessions', [
        'id' => $session->id,
        'status' => 'completed',
        'actual_duration_minutes' => 62,
        'actual_tss' => 74,
    ]);
});

it('rejects completion when no linked activity exists', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['activity_id']);
});

it('forbids completion for another athletes session', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $session = createSessionForCompletionAthlete($otherAthlete);
    Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'training_session_id' => $session->id,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertForbidden();
});

it('forbids reverting another athletes completed session', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $session = createSessionForCompletionAthlete($otherAthlete, [
        'status' => 'completed',
        'completed_at' => now(),
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/revert-completion")
        ->assertForbidden();
});

it('rejects double completion requests', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete, [
        'status' => 'completed',
        'completed_at' => now(),
        'actual_duration_minutes' => 55,
    ]);

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'duration_seconds' => 3300,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['session']);
});

it('allows reverting a completed session while keeping linked activity', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete, [
        'status' => 'completed',
        'completed_at' => now(),
        'actual_duration_minutes' => 60,
        'actual_tss' => 52,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/revert-completion")
        ->assertOk()
        ->assertJsonPath('data.status', 'planned')
        ->assertJsonPath('data.is_completed', false)
        ->assertJsonPath('data.actual_duration_minutes', null)
        ->assertJsonPath('data.actual_tss', null)
        ->assertJsonPath('data.linked_activity_id', $activity->id);

    $this->assertDatabaseHas('training_sessions', [
        'id' => $session->id,
        'status' => 'planned',
        'actual_duration_minutes' => null,
        'actual_tss' => null,
        'completed_at' => null,
    ]);
});

it('rejects revert when session is not completed', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete, [
        'status' => 'planned',
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/revert-completion")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['session']);
});

it('returns forbidden for coach and direct admin completion writes', function () {
    $coach = User::factory()->coach()->create();
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForCompletionAthlete($athlete);
    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
    ]);

    $this
        ->actingAs($coach)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertForbidden();
});

it('allows completion and reversion for impersonated athlete context', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForCompletionAthlete($athlete);

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'duration_seconds' => 3000,
    ]);

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertOk()
        ->assertJsonPath('data.status', 'completed');

    $this
        ->postJson("/api/training-sessions/{$session->id}/revert-completion")
        ->assertOk()
        ->assertJsonPath('data.status', 'planned');
});

/**
 * @param  array<string, mixed>  $sessionOverrides
 */
function createSessionForCompletionAthlete(
    User $athlete,
    array $sessionOverrides = [],
): TrainingSession {
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-10-01',
        'ends_at' => '2026-10-07',
    ]);

    return TrainingSession::factory()->for($week)->create([
        'status' => 'planned',
        'actual_duration_minutes' => null,
        'actual_tss' => null,
        'completed_at' => null,
        ...$sessionOverrides,
    ]);
}
