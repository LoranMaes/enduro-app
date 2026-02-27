<?php

use App\Models\Goal;
use App\Models\User;

it('requires authentication for goals api endpoints', function () {
    $this->getJson('/api/goals')->assertUnauthorized();
    $this->postJson('/api/goals', [
        'type' => 'text',
        'title' => 'Build consistency',
    ])->assertUnauthorized();
});

it('allows an athlete to manage own goals', function () {
    $athlete = User::factory()->athlete()->create();

    $createResponse = $this
        ->actingAs($athlete)
        ->postJson('/api/goals', [
            'type' => 'distance',
            'sport' => 'run',
            'title' => 'Run 100km this month',
            'description' => 'Keep easy days easy.',
            'target_date' => '2026-03-20',
            'priority' => 'high',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $athlete->id)
        ->assertJsonPath('data.status', 'active');

    $goalId = (int) $createResponse->json('data.id');

    $this
        ->actingAs($athlete)
        ->getJson('/api/goals?from=2026-03-01&to=2026-03-31')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $goalId);

    $this
        ->actingAs($athlete)
        ->patchJson("/api/goals/{$goalId}", [
            'status' => 'completed',
            'title' => 'Run 100km in March',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'completed')
        ->assertJsonPath('data.title', 'Run 100km in March');
});

it('forbids coaches and non owner athletes from goal writes', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();
    $goal = Goal::factory()->for($athlete)->create();

    $this
        ->actingAs($coach)
        ->postJson('/api/goals', [
            'type' => 'text',
            'title' => 'Blocked',
        ])
        ->assertForbidden();

    $this
        ->actingAs($otherAthlete)
        ->patchJson("/api/goals/{$goal->id}", [
            'status' => 'cancelled',
        ])
        ->assertForbidden();
});

it('allows admins to create and update goals for athletes', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $createResponse = $this
        ->actingAs($admin)
        ->postJson('/api/goals', [
            'user_id' => $athlete->id,
            'type' => 'race',
            'sport' => 'run',
            'title' => 'Marathon race goal',
            'target_date' => '2026-10-10',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $athlete->id);

    $goalId = (int) $createResponse->json('data.id');

    $this
        ->actingAs($admin)
        ->patchJson("/api/goals/{$goalId}", [
            'status' => 'completed',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'completed');
});

it('allows goal creation while impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->postJson('/api/goals', [
            'type' => 'text',
            'title' => 'Stay healthy',
            'target_date' => '2026-04-04',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $athlete->id);
});
