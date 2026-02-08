<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('requires authentication for training session read endpoints', function () {
    $session = TrainingSession::factory()->create();

    $this->getJson('/api/training-sessions')->assertUnauthorized();
    $this->getJson("/api/training-sessions/{$session->id}")->assertUnauthorized();
});

it('allows athletes to read only their own sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownPlan = TrainingPlan::factory()->for($athlete)->create();
    $ownWeek = TrainingWeek::factory()->for($ownPlan)->create();
    $ownSession = TrainingSession::factory()->for($ownWeek)->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    TrainingSession::factory()->for(TrainingWeek::factory()->for($otherPlan))->create();

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/training-sessions');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $ownSession->id);
});

it('forbids athletes from reading another athletes session', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    $otherWeek = TrainingWeek::factory()->for($otherPlan)->create();
    $otherSession = TrainingSession::factory()->for($otherWeek)->create();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions/{$otherSession->id}")
        ->assertForbidden();
});

it('allows admins to read all sessions', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    $planOne = TrainingPlan::factory()->for($athleteOne)->create();
    $planTwo = TrainingPlan::factory()->for($athleteTwo)->create();

    TrainingSession::factory()->for(TrainingWeek::factory()->for($planOne))->create();
    TrainingSession::factory()->for(TrainingWeek::factory()->for($planTwo))->create();

    $response = $this
        ->actingAs($admin)
        ->getJson('/api/training-sessions');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
    $response->assertJsonStructure([
        'data',
        'links',
        'meta' => [
            'current_page',
            'last_page',
            'per_page',
            'total',
        ],
    ]);
});

it('returns only assigned athlete sessions for coaches', function () {
    $coach = User::factory()->coach()->create();
    $assignedAthlete = User::factory()->athlete()->create();
    $unassignedAthlete = User::factory()->athlete()->create();

    $assignedPlan = TrainingPlan::factory()->for($assignedAthlete)->create();
    $assignedSession = TrainingSession::factory()->for(TrainingWeek::factory()->for($assignedPlan))->create();
    $unassignedPlan = TrainingPlan::factory()->for($unassignedAthlete)->create();
    TrainingSession::factory()->for(TrainingWeek::factory()->for($unassignedPlan))->create();

    $coach->coachedAthletes()->attach($assignedAthlete->id);

    $response = $this
        ->actingAs($coach)
        ->getJson('/api/training-sessions');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $assignedSession->id);
});

it('filters sessions by date window for calendar reads', function () {
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-01-15',
        'sport' => 'bike',
    ]);
    TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-03-15',
        'sport' => 'run',
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/training-sessions?from=2026-03-01&to=2026-03-31');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.sport', 'run');
});

it('filters sessions by training plan and week when provided', function () {
    $athlete = User::factory()->athlete()->create();

    $planOne = TrainingPlan::factory()->for($athlete)->create();
    $planTwo = TrainingPlan::factory()->for($athlete)->create();

    $weekOne = TrainingWeek::factory()->for($planOne)->create();
    $weekTwo = TrainingWeek::factory()->for($planTwo)->create();

    $sessionOne = TrainingSession::factory()->for($weekOne)->create();
    TrainingSession::factory()->for($weekTwo)->create();

    $byPlan = $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions?training_plan_id={$planOne->id}");

    $byPlan->assertOk();
    $byPlan->assertJsonCount(1, 'data');
    $byPlan->assertJsonPath('data.0.id', $sessionOne->id);

    $byWeek = $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions?training_week_id={$weekOne->id}");

    $byWeek->assertOk();
    $byWeek->assertJsonCount(1, 'data');
    $byWeek->assertJsonPath('data.0.id', $sessionOne->id);
});
