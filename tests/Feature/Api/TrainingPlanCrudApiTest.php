<?php

use App\Models\TrainingPlan;
use App\Models\User;

it('requires authentication for training plan write endpoints', function () {
    $plan = TrainingPlan::factory()->create();

    $payload = [
        'title' => 'Base Build',
        'description' => 'Spring build block',
        'starts_at' => '2026-03-01',
        'ends_at' => '2026-03-31',
    ];

    $this->postJson('/api/training-plans', $payload)->assertUnauthorized();
    $this->putJson("/api/training-plans/{$plan->id}", $payload)->assertUnauthorized();
    $this->deleteJson("/api/training-plans/{$plan->id}")->assertUnauthorized();
});

it('allows athletes to create update and delete their own training plans', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $createResponse = $this
        ->actingAs($athlete)
        ->postJson('/api/training-plans', [
            'user_id' => $otherAthlete->id,
            'title' => 'Build Block',
            'description' => 'Focus on threshold work',
            'starts_at' => '2026-03-01',
            'ends_at' => '2026-03-31',
        ]);

    $createResponse->assertCreated();
    $planId = $createResponse->json('data.id');

    $this->assertDatabaseHas('training_plans', [
        'id' => $planId,
        'user_id' => $athlete->id,
        'title' => 'Build Block',
    ]);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-plans/{$planId}", [
            'title' => 'Build Block Updated',
            'description' => 'Updated notes',
            'starts_at' => '2026-03-02',
            'ends_at' => '2026-03-30',
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Build Block Updated')
        ->assertJsonPath('data.starts_at', '2026-03-02');

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-plans/{$planId}")
        ->assertNoContent();

    $this->assertDatabaseMissing('training_plans', [
        'id' => $planId,
    ]);
});

it('forbids athletes from modifying other athletes plans', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();
    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-plans/{$otherPlan->id}", [
            'title' => 'Blocked Update',
            'description' => null,
            'starts_at' => '2026-04-01',
            'ends_at' => '2026-04-10',
        ])
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-plans/{$otherPlan->id}")
        ->assertForbidden();
});

it('allows admins to access and manage all training plans', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create([
        'title' => 'Original Title',
    ]);

    $this
        ->actingAs($admin)
        ->getJson("/api/training-plans/{$plan->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $plan->id);

    $created = $this
        ->actingAs($admin)
        ->postJson('/api/training-plans', [
            'user_id' => $athlete->id,
            'title' => 'Admin Created Plan',
            'description' => 'Admin created for athlete',
            'starts_at' => '2026-05-01',
            'ends_at' => '2026-05-31',
        ]);

    $created->assertCreated();

    $this
        ->actingAs($admin)
        ->putJson("/api/training-plans/{$plan->id}", [
            'title' => 'Admin Updated Plan',
            'description' => 'Admin update',
            'starts_at' => '2026-05-02',
            'ends_at' => '2026-05-30',
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Admin Updated Plan');

    $this
        ->actingAs($admin)
        ->deleteJson("/api/training-plans/{$plan->id}")
        ->assertNoContent();
});

it('validates training plan date ordering on create and update', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-plans', [
            'title' => 'Invalid Dates',
            'description' => null,
            'starts_at' => '2026-06-10',
            'ends_at' => '2026-06-01',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ends_at']);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-plans/{$plan->id}", [
            'title' => 'Invalid Dates Update',
            'description' => null,
            'starts_at' => '2026-06-10',
            'ends_at' => '2026-06-01',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ends_at']);
});
