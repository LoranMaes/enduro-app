<?php

use App\Models\TrainingPlan;
use App\Models\TrainingWeek;
use App\Models\User;

it('requires authentication for training week write endpoints', function () {
    $week = TrainingWeek::factory()->create();

    $payload = [
        'training_plan_id' => $week->training_plan_id,
        'starts_at' => '2026-07-01',
        'ends_at' => '2026-07-07',
    ];

    $this->postJson('/api/training-weeks', $payload)->assertUnauthorized();
    $this->putJson("/api/training-weeks/{$week->id}", [
        'starts_at' => '2026-07-02',
        'ends_at' => '2026-07-08',
    ])->assertUnauthorized();
    $this->deleteJson("/api/training-weeks/{$week->id}")->assertUnauthorized();
});

it('allows athletes to create update and delete weeks in own plans', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();

    $created = $this
        ->actingAs($athlete)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $plan->id,
            'starts_at' => '2026-07-01',
            'ends_at' => '2026-07-07',
        ]);

    $created->assertCreated();
    $weekId = $created->json('data.id');

    $this->assertDatabaseHas('training_weeks', [
        'id' => $weekId,
        'training_plan_id' => $plan->id,
        'starts_at' => '2026-07-01',
        'ends_at' => '2026-07-07',
    ]);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-weeks/{$weekId}", [
            'starts_at' => '2026-07-08',
            'ends_at' => '2026-07-14',
        ])
        ->assertOk()
        ->assertJsonPath('data.starts_at', '2026-07-08')
        ->assertJsonPath('data.ends_at', '2026-07-14');

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-weeks/{$weekId}")
        ->assertOk();

    $this->assertDatabaseMissing('training_weeks', [
        'id' => $weekId,
    ]);
});

it('forbids athletes from modifying weeks in plans they do not own', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    $otherWeek = TrainingWeek::factory()->for($otherPlan)->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $otherPlan->id,
            'starts_at' => '2026-08-01',
            'ends_at' => '2026-08-07',
        ])
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-weeks/{$otherWeek->id}", [
            'starts_at' => '2026-08-08',
            'ends_at' => '2026-08-14',
        ])
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-weeks/{$otherWeek->id}")
        ->assertForbidden();
});

it('allows admins to manage all training weeks', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-09-01',
        'ends_at' => '2026-09-07',
    ]);

    $this
        ->actingAs($admin)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $plan->id,
            'starts_at' => '2026-09-08',
            'ends_at' => '2026-09-14',
        ])
        ->assertCreated();

    $this
        ->actingAs($admin)
        ->putJson("/api/training-weeks/{$week->id}", [
            'starts_at' => '2026-09-15',
            'ends_at' => '2026-09-21',
        ])
        ->assertOk()
        ->assertJsonPath('data.starts_at', '2026-09-15')
        ->assertJsonPath('data.ends_at', '2026-09-21');

    $this
        ->actingAs($admin)
        ->deleteJson("/api/training-weeks/{$week->id}")
        ->assertOk();
});

it('rejects overlapping weeks within the same training plan', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();

    TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-10-01',
        'ends_at' => '2026-10-07',
    ]);
    $weekToUpdate = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-10-15',
        'ends_at' => '2026-10-21',
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $plan->id,
            'starts_at' => '2026-10-05',
            'ends_at' => '2026-10-12',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['starts_at']);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-weeks/{$weekToUpdate->id}", [
            'starts_at' => '2026-10-06',
            'ends_at' => '2026-10-13',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['starts_at']);
});

it('rejects invalid training week date ranges', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-weeks', [
            'training_plan_id' => $plan->id,
            'starts_at' => '2026-11-10',
            'ends_at' => '2026-11-10',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ends_at']);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-weeks/{$week->id}", [
            'starts_at' => '2026-11-12',
            'ends_at' => '2026-11-11',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ends_at']);
});
