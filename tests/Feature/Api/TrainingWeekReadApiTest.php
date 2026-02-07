<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('returns athlete owned weeks with nested sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownPlan = TrainingPlan::factory()->for($athlete)->create();
    $ownWeek = TrainingWeek::factory()->for($ownPlan)->create();
    $ownSession = TrainingSession::factory()->for($ownWeek)->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    TrainingWeek::factory()->for($otherPlan)->create();

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/training-weeks');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $ownWeek->id);
    $response->assertJsonPath('data.0.training_sessions.0.id', $ownSession->id);
});

it('forbids athletes from viewing another athletes week', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    $otherWeek = TrainingWeek::factory()->for($otherPlan)->create();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-weeks/{$otherWeek->id}")
        ->assertForbidden();
});

it('allows admins to list all weeks', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    $planOne = TrainingPlan::factory()->for($athleteOne)->create();
    $planTwo = TrainingPlan::factory()->for($athleteTwo)->create();

    TrainingWeek::factory()->for($planOne)->create();
    TrainingWeek::factory()->for($planTwo)->create();

    $response = $this
        ->actingAs($admin)
        ->getJson('/api/training-weeks');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

it('returns empty weeks list for coaches until assignment logic exists', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    TrainingWeek::factory()->for($plan)->create();

    $response = $this
        ->actingAs($coach)
        ->getJson('/api/training-weeks');

    $response->assertOk();
    $response->assertJsonCount(0, 'data');
});
