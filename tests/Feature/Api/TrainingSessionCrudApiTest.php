<?php

use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;

it('requires authentication for training session write endpoints', function () {
    $week = TrainingWeek::factory()->create();
    $session = TrainingSession::factory()->for($week)->create();

    $payload = [
        'training_week_id' => $week->id,
        'date' => '2026-07-03',
        'sport' => 'run',
        'planned_duration_minutes' => 90,
        'planned_tss' => 65,
        'notes' => 'Endurance run',
    ];

    $this->postJson('/api/training-sessions', $payload)->assertUnauthorized();
    $this->putJson("/api/training-sessions/{$session->id}", $payload)->assertUnauthorized();
    $this->deleteJson("/api/training-sessions/{$session->id}")->assertUnauthorized();
});

it('allows athletes to create update and delete their own sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-07-01',
        'ends_at' => '2026-07-07',
    ]);

    $created = $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->id,
            'date' => '2026-07-03',
            'sport' => 'run',
            'planned_duration_minutes' => 90,
            'planned_tss' => 65,
            'notes' => 'Endurance run',
            'planned_structure' => [
                'unit' => 'threshold_hr_percent',
                'mode' => 'range',
                'steps' => [
                    [
                        'id' => 'step-1',
                        'type' => 'warmup',
                        'duration_minutes' => 12,
                        'target' => null,
                        'range_min' => 55,
                        'range_max' => 65,
                        'repeat_count' => 1,
                        'note' => null,
                    ],
                ],
            ],
        ]);

    $created->assertCreated()
        ->assertJsonPath('data.training_week_id', $week->id)
        ->assertJsonPath('data.scheduled_date', '2026-07-03')
        ->assertJsonPath('data.duration_minutes', 90)
        ->assertJsonPath('data.planned_tss', 65)
        ->assertJsonPath('data.status', 'planned')
        ->assertJsonPath('data.planned_structure.unit', 'threshold_hr_percent');

    $sessionId = $created->json('data.id');

    $this->assertDatabaseHas('training_sessions', [
        'id' => $sessionId,
        'user_id' => $athlete->id,
        'training_week_id' => $week->id,
        'scheduled_date' => '2026-07-03',
        'sport' => 'run',
        'duration_minutes' => 90,
        'planned_tss' => 65,
        'notes' => 'Endurance run',
        'status' => 'planned',
    ]);

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-sessions/{$sessionId}", [
            'training_week_id' => $week->id,
            'date' => '2026-07-04',
            'sport' => 'bike',
            'planned_duration_minutes' => 120,
            'planned_tss' => 80,
            'notes' => 'Long aerobic ride',
            'planned_structure' => [
                'unit' => 'ftp_percent',
                'mode' => 'target',
                'steps' => [
                    [
                        'id' => 'step-2',
                        'type' => 'active',
                        'duration_minutes' => 8,
                        'target' => 90,
                        'range_min' => null,
                        'range_max' => null,
                        'repeat_count' => 2,
                        'note' => null,
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.scheduled_date', '2026-07-04')
        ->assertJsonPath('data.sport', 'bike')
        ->assertJsonPath('data.duration_minutes', 120)
        ->assertJsonPath('data.planned_tss', 80)
        ->assertJsonPath('data.notes', 'Long aerobic ride')
        ->assertJsonPath('data.planned_structure.mode', 'target');

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-sessions/{$sessionId}", [
            'training_week_id' => null,
            'date' => '2026-07-05',
            'sport' => 'run',
            'planned_duration_minutes' => 70,
            'planned_tss' => 50,
            'notes' => 'Standalone session',
        ])
        ->assertOk()
        ->assertJsonPath('data.training_week_id', null)
        ->assertJsonPath('data.scheduled_date', '2026-07-05');

    $this->assertDatabaseHas('training_sessions', [
        'id' => $sessionId,
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-07-05',
    ]);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$sessionId}")
        ->assertNoContent();

    $this->assertDatabaseMissing('training_sessions', [
        'id' => $sessionId,
    ]);
});

it('allows athletes to create sessions without assigning a training week', function () {
    $athlete = User::factory()->athlete()->create();

    $created = $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => null,
            'date' => '2026-07-05',
            'sport' => 'run',
            'planned_duration_minutes' => 50,
            'planned_tss' => 40,
            'notes' => 'Standalone easy run',
        ]);

    $created->assertCreated()
        ->assertJsonPath('data.training_week_id', null)
        ->assertJsonPath('data.scheduled_date', '2026-07-05')
        ->assertJsonPath('data.duration_minutes', 50);

    $this->assertDatabaseHas('training_sessions', [
        'id' => $created->json('data.id'),
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-07-05',
        'sport' => 'run',
    ]);
});

it('forbids athletes from mutating another athletes sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownPlan = TrainingPlan::factory()->for($athlete)->create();
    $ownWeek = TrainingWeek::factory()->for($ownPlan)->create([
        'starts_at' => '2026-08-01',
        'ends_at' => '2026-08-07',
    ]);

    $otherPlan = TrainingPlan::factory()->for($otherAthlete)->create();
    $otherWeek = TrainingWeek::factory()->for($otherPlan)->create([
        'starts_at' => '2026-08-01',
        'ends_at' => '2026-08-07',
    ]);
    $otherSession = TrainingSession::factory()->for($otherWeek)->create();

    $this
        ->actingAs($athlete)
        ->putJson("/api/training-sessions/{$otherSession->id}", [
            'training_week_id' => $ownWeek->id,
            'date' => '2026-08-02',
            'sport' => 'swim',
            'planned_duration_minutes' => 45,
            'planned_tss' => 35,
            'notes' => 'Pool session',
        ])
        ->assertForbidden();

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$otherSession->id}")
        ->assertForbidden();
});

it('allows admins to mutate any training session', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-09-01',
        'ends_at' => '2026-09-07',
    ]);
    $session = TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-09-02',
        'sport' => 'run',
        'duration_minutes' => 60,
        'planned_tss' => 50,
    ]);

    $this
        ->actingAs($admin)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->id,
            'date' => '2026-09-03',
            'sport' => 'swim',
            'planned_duration_minutes' => 30,
            'planned_tss' => 25,
            'notes' => 'Technique set',
        ])
        ->assertCreated();

    $this
        ->actingAs($admin)
        ->putJson("/api/training-sessions/{$session->id}", [
            'training_week_id' => $week->id,
            'date' => '2026-09-04',
            'sport' => 'bike',
            'planned_duration_minutes' => 100,
            'planned_tss' => 85,
            'notes' => 'Threshold intervals',
        ])
        ->assertOk()
        ->assertJsonPath('data.scheduled_date', '2026-09-04')
        ->assertJsonPath('data.sport', 'bike')
        ->assertJsonPath('data.duration_minutes', 100);

    $this
        ->actingAs($admin)
        ->deleteJson("/api/training-sessions/{$session->id}")
        ->assertNoContent();
});

it('returns forbidden for coaches on training session writes', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-10-01',
        'ends_at' => '2026-10-07',
    ]);
    $session = TrainingSession::factory()->for($week)->create();

    $this
        ->actingAs($coach)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->id,
            'date' => '2026-10-02',
            'sport' => 'run',
            'planned_duration_minutes' => 75,
            'planned_tss' => 55,
            'notes' => 'Tempo',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->putJson("/api/training-sessions/{$session->id}", [
            'training_week_id' => $week->id,
            'date' => '2026-10-03',
            'sport' => 'bike',
            'planned_duration_minutes' => 80,
            'planned_tss' => 60,
            'notes' => 'Steady ride',
        ])
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->deleteJson("/api/training-sessions/{$session->id}")
        ->assertForbidden();
});

it('validates training session write payloads', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-11-01',
        'ends_at' => '2026-11-07',
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => 999999,
            'date' => '2026-11-03',
            'sport' => 'run',
            'planned_duration_minutes' => 60,
            'planned_tss' => 45,
            'notes' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['training_week_id']);

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [
            'training_week_id' => $week->id,
            'date' => '2026-11-09',
            'sport' => 'run',
            'planned_duration_minutes' => 60,
            'planned_tss' => 45,
            'notes' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['date']);

    $this
        ->actingAs($athlete)
        ->postJson('/api/training-sessions', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'date',
            'sport',
            'planned_duration_minutes',
        ]);
});
