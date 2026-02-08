<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('requires authentication for training session link endpoints', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForLinkingAthlete($athlete);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
    ]);

    $this
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertUnauthorized();

    $this
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertUnauthorized();
});

it('allows athletes to link and unlink their own activities', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForLinkingAthlete($athlete, [
        'scheduled_date' => '2026-09-03',
        'sport' => 'bike',
    ]);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'sport' => 'bike',
        'started_at' => '2026-09-03 07:30:00',
        'duration_seconds' => 3600,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertOk()
        ->assertJsonPath('activity.id', $activity->id)
        ->assertJsonPath('activity.linked_session_id', $session->id)
        ->assertJsonPath('session.id', $session->id)
        ->assertJsonPath('session.linked_activity_id', $activity->id);

    $this->assertDatabaseHas('activities', [
        'id' => $activity->id,
        'training_session_id' => $session->id,
    ]);

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions/{$session->id}")
        ->assertOk()
        ->assertJsonPath('data.linked_activity_id', $activity->id)
        ->assertJsonPath('data.linked_activity_summary.id', $activity->id);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertOk()
        ->assertJsonPath('activity.id', $activity->id)
        ->assertJsonPath('activity.linked_session_id', null)
        ->assertJsonPath('session.linked_activity_id', null);

    $this->assertDatabaseHas('activities', [
        'id' => $activity->id,
        'training_session_id' => null,
    ]);
});

it('forbids athletes from linking another athletes session', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $session = createSessionForLinkingAthlete($otherAthlete);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertForbidden();
});

it('rejects linking another athletes activity', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $session = createSessionForLinkingAthlete($athlete);
    $activity = Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['activity_id']);
});

it('rejects linking an activity that is already linked to another session', function () {
    $athlete = User::factory()->athlete()->create();
    $sessionOne = createSessionForLinkingAthlete($athlete, [
        'scheduled_date' => '2026-10-01',
    ]);
    $sessionTwo = createSessionForLinkingAthlete($athlete, [
        'scheduled_date' => '2026-10-02',
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $sessionOne->id,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$sessionTwo->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['activity_id']);
});

it('rejects linking when the session already has a different linked activity', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForLinkingAthlete($athlete);

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
    ]);

    $newActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $newActivity->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['activity_id']);
});

it('returns forbidden for coaches and non-impersonated admins', function () {
    $coach = User::factory()->coach()->create();
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForLinkingAthlete($athlete);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($coach)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertForbidden();
});

it('rejects unlink requests when no activity is linked', function () {
    $athlete = User::factory()->athlete()->create();
    $session = createSessionForLinkingAthlete($athlete);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['activity_id']);
});

it('allows impersonated admins to link and unlink as the impersonated athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $session = createSessionForLinkingAthlete($athlete);
    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->postJson("/api/training-sessions/{$session->id}/link-activity", [
            'activity_id' => $activity->id,
        ])
        ->assertOk()
        ->assertJsonPath('activity.linked_session_id', $session->id);

    $this
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertOk()
        ->assertJsonPath('activity.linked_session_id', null);
});

/**
 * @param  array<string, mixed>  $sessionOverrides
 */
function createSessionForLinkingAthlete(
    User $athlete,
    array $sessionOverrides = [],
): TrainingSession {
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-09-01',
        'ends_at' => '2026-09-07',
    ]);

    return TrainingSession::factory()->for($week)->create($sessionOverrides);
}
