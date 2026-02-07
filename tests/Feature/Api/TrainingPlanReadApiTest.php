<?php

use App\Enums\TrainingSessionStatus;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('returns nested weeks and sessions for athlete owned plans only', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownPlan = TrainingPlan::factory()->for($athlete)->create();
    $ownWeek = TrainingWeek::factory()->for($ownPlan)->create();
    $ownSession = TrainingSession::factory()->for($ownWeek)->create([
        'sport' => 'bike',
        'status' => TrainingSessionStatus::Planned->value,
    ]);

    TrainingPlan::factory()->for($otherAthlete)->create();

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/training-plans');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $ownPlan->id);
    $response->assertJsonPath('data.0.training_weeks.0.id', $ownWeek->id);
    $response->assertJsonPath('data.0.training_weeks.0.training_sessions.0.id', $ownSession->id);
    $response->assertJsonPath('data.0.training_weeks.0.training_sessions.0.sport', 'bike');
    $response->assertJsonPath('data.0.training_weeks.0.training_sessions.0.status', TrainingSessionStatus::Planned->value);
});

it('forbids athletes from viewing another athletes training plan', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-plans/{$otherPlan->id}")
        ->assertForbidden();
});

it('allows admins to list all training plans', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    TrainingPlan::factory()->for($athleteOne)->create();
    TrainingPlan::factory()->for($athleteTwo)->create();

    $response = $this
        ->actingAs($admin)
        ->getJson('/api/training-plans');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
});

it('returns an empty list for coaches until assignment logic is implemented', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    TrainingPlan::factory()->for($athlete)->create();

    $response = $this
        ->actingAs($coach)
        ->getJson('/api/training-plans');

    $response->assertOk();
    $response->assertJsonCount(0, 'data');
});
