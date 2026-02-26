<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('returns opaque identifiers for training sessions in dual mode', function () {
    config()->set('id_migration.ids.mode', 'dual');

    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => true,
    ]);
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-07-01',
        'ends_at' => '2026-07-07',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-07-03',
    ]);

    $this->actingAs($athlete)
        ->getJson('/api/training-sessions?from=2026-07-01&to=2026-07-07')
        ->assertOk()
        ->assertJsonPath('data.0.id', $session->public_id)
        ->assertJsonPath('data.0.training_week_id', $week->public_id);
});

it('accepts training week public identifiers on training session creation in dual mode', function () {
    config()->set('id_migration.ids.mode', 'dual');

    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => true,
    ]);
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-08-01',
        'ends_at' => '2026-08-07',
    ]);

    $response = $this->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->public_id,
            'date' => '2026-08-02',
            'sport' => 'run',
            'title' => 'Dual mode run',
            'planned_duration_minutes' => 45,
            'planned_tss' => 38,
            'notes' => 'Created with public week id',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.training_week_id', $week->public_id)
        ->assertJsonPath('data.scheduled_date', '2026-08-02');

    $createdSession = TrainingSession::query()
        ->where('user_id', $athlete->id)
        ->whereDate('scheduled_date', '2026-08-02')
        ->firstOrFail();

    expect($createdSession->training_week_id)->toBe($week->id);
    $response->assertJsonPath('data.id', $createdSession->public_id);
});

it('keeps numeric fallback working in dual mode for training session routes', function () {
    config()->set('id_migration.ids.mode', 'dual');

    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-09-01',
        'ends_at' => '2026-09-07',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-09-03',
    ]);

    $this->actingAs($athlete)
        ->getJson("/api/training-sessions/{$session->public_id}")
        ->assertOk()
        ->assertJsonPath('data.id', $session->public_id);

    $this->actingAs($athlete)
        ->getJson("/api/training-sessions/{$session->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $session->public_id);
});
