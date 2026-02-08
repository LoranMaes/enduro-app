<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('allows coaches to read assigned athlete calendars', function () {
    $coach = User::factory()->coach()->create();
    $assignedAthlete = User::factory()->athlete()->create();

    $assignedPlan = TrainingPlan::factory()->for($assignedAthlete)->create();
    $assignedWeek = TrainingWeek::factory()->for($assignedPlan)->create();
    $assignedSession = TrainingSession::factory()->for($assignedWeek)->create();

    $coach->coachedAthletes()->attach($assignedAthlete->id);

    $this
        ->actingAs($coach)
        ->get("/athletes/{$assignedAthlete->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('viewingAthlete.id', $assignedAthlete->id)
            ->where('viewingAthlete.name', $assignedAthlete->name)
        );

    $this
        ->actingAs($coach)
        ->getJson('/api/training-plans')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $assignedPlan->id);

    $this
        ->actingAs($coach)
        ->getJson('/api/training-weeks')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $assignedWeek->id);

    $this
        ->actingAs($coach)
        ->getJson('/api/training-sessions')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $assignedSession->id);
});

it('forbids coaches from viewing unassigned athletes and their calendar records', function () {
    $coach = User::factory()->coach()->create();
    $unassignedAthlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($unassignedAthlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();
    $session = TrainingSession::factory()->for($week)->create();

    $this
        ->actingAs($coach)
        ->get("/athletes/{$unassignedAthlete->id}")
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->getJson("/api/training-plans/{$plan->id}")
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->getJson("/api/training-weeks/{$week->id}")
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->getJson("/api/training-sessions/{$session->id}")
        ->assertForbidden();
});

it('forbids coaches from write access across plans weeks and sessions', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create([
        'starts_at' => '2026-08-01',
        'ends_at' => '2026-08-31',
    ]);
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-08-04',
        'ends_at' => '2026-08-10',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-08-05',
    ]);

    $coach->coachedAthletes()->attach($athlete->id);

    $this
        ->actingAs($coach)
        ->postJson('/api/training-plans', [
            'user_id' => $athlete->id,
            'title' => 'Coach Block',
            'description' => null,
            'starts_at' => '2026-09-01',
            'ends_at' => '2026-09-30',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->putJson("/api/training-plans/{$plan->id}", [
            'title' => 'Coach Updated Plan',
            'description' => null,
            'starts_at' => '2026-08-01',
            'ends_at' => '2026-08-31',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $plan->id,
            'starts_at' => '2026-08-11',
            'ends_at' => '2026-08-17',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->putJson("/api/training-weeks/{$week->id}", [
            'starts_at' => '2026-08-04',
            'ends_at' => '2026-08-10',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->id,
            'date' => '2026-08-06',
            'sport' => 'run',
            'planned_duration_minutes' => 50,
            'planned_tss' => 35,
            'notes' => null,
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->putJson("/api/training-sessions/{$session->id}", [
            'training_week_id' => $week->id,
            'date' => '2026-08-05',
            'sport' => 'run',
            'planned_duration_minutes' => 60,
            'planned_tss' => 45,
            'notes' => null,
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->deleteJson("/api/training-sessions/{$session->id}")
        ->assertForbidden();
});

it('keeps admin visibility unchanged', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    $planOne = TrainingPlan::factory()->for($athleteOne)->create();
    $planTwo = TrainingPlan::factory()->for($athleteTwo)->create();
    TrainingWeek::factory()->for($planOne)->create();
    TrainingWeek::factory()->for($planTwo)->create();
    TrainingSession::factory()->for(TrainingWeek::factory()->for($planOne))->create();
    TrainingSession::factory()->for(TrainingWeek::factory()->for($planTwo))->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/training-plans')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this
        ->actingAs($admin)
        ->getJson('/api/training-weeks')
        ->assertOk()
        ->assertJsonCount(4, 'data');

    $this
        ->actingAs($admin)
        ->getJson('/api/training-sessions')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this
        ->actingAs($admin)
        ->get("/athletes/{$athleteOne->id}")
        ->assertOk();
});

it('keeps athlete access behavior unchanged', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownPlan = TrainingPlan::factory()->for($athlete)->create();
    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    $otherWeek = TrainingWeek::factory()->for($otherPlan)->create();
    $otherSession = TrainingSession::factory()->for($otherWeek)->create();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-plans/{$ownPlan->id}")
        ->assertOk();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-plans/{$otherPlan->id}")
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-weeks/{$otherWeek->id}")
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->getJson("/api/training-sessions/{$otherSession->id}")
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->get("/athletes/{$athlete->id}")
        ->assertOk();

    $this
        ->actingAs($athlete)
        ->get("/athletes/{$otherAthlete->id}")
        ->assertForbidden();
});
