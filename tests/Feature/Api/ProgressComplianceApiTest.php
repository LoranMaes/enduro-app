<?php

use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;

it('returns weekly compliance using planned sessions only', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-10',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 30,
        'planned_tss' => 0,
        'actual_tss' => 0,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-11',
        'status' => TrainingSessionStatus::Planned->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => null,
        'actual_duration_minutes' => null,
        'planned_tss' => 0,
        'actual_tss' => null,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-11',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 20,
        'planned_tss' => 200,
        'actual_tss' => 120,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-18',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 40,
        'planned_tss' => 0,
        'actual_tss' => 0,
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/progress/compliance?from=2026-02-09&to=2026-02-22')
        ->assertOk()
        ->json();

    expect($response['weeks'])->toHaveCount(2);

    $firstWeek = $response['weeks'][0];
    $secondWeek = $response['weeks'][1];

    expect($firstWeek['week_starts_at'])->toBe('2026-02-09');
    expect($firstWeek['planned_sessions_count'])->toBe(2);
    expect($firstWeek['planned_completed_count'])->toBe(1);
    expect($firstWeek['compliance_ratio'])->toBe(0.5);
    expect($firstWeek['completed_duration_minutes_total'])->toBe(50);
    expect($firstWeek['planned_tss_total'])->toBe(0);
    expect($firstWeek['completed_tss_total'])->toBe(120);
    expect($firstWeek['load_state'])->toBe('insufficient');
    expect($firstWeek['load_state_ratio'])->toBeNull();
    expect($firstWeek['load_state_source'])->toBe('planned_completed_tss_ratio');
    expect($firstWeek['actual_minutes_total'])->toBe(50);
    expect($firstWeek['recommendation_band'])->toBeNull();

    expect($secondWeek['week_starts_at'])->toBe('2026-02-16');
    expect($secondWeek['planned_sessions_count'])->toBe(1);
    expect($secondWeek['planned_completed_count'])->toBe(1);
    expect($secondWeek['compliance_ratio'])->toBe(1);
    expect($secondWeek['actual_minutes_total'])->toBe(40);

    expect($response['summary']['total_planned_sessions_count'])->toBe(3);
    expect($response['summary']['total_planned_completed_count'])->toBe(2);
    expect($response['summary']['compliance_ratio'])->toBe(2 / 3);

    $this->assertDatabaseHas('athlete_week_metrics', [
        'user_id' => $athlete->id,
        'week_start_date' => '2026-02-09',
        'planned_sessions_count' => 2,
        'planned_completed_count' => 1,
    ]);
});

it('classifies weekly load states from planned/completed tss ratio', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-03-02',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 100,
        'actual_tss' => 80,
        'completed_at' => now(),
    ]);
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-03-09',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 100,
        'actual_tss' => 95,
        'completed_at' => now(),
    ]);
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-03-16',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 100,
        'actual_tss' => 130,
        'completed_at' => now(),
    ]);
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-03-16',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'planned_tss' => 300,
        'actual_tss' => 300,
        'completed_at' => now(),
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/progress/compliance?from=2026-03-02&to=2026-03-22')
        ->assertOk()
        ->json();

    expect($response['weeks'])->toHaveCount(3);

    $lowWeek = $response['weeks'][0];
    $inRangeWeek = $response['weeks'][1];
    $highWeek = $response['weeks'][2];

    expect($lowWeek['load_state'])->toBe('low');
    expect(abs($lowWeek['load_state_ratio'] - 0.8))->toBeLessThan(0.0001);
    expect($lowWeek['planned_tss_total'])->toBe(100);
    expect($lowWeek['completed_tss_total'])->toBe(80);

    expect($inRangeWeek['load_state'])->toBe('in_range');
    expect(abs($inRangeWeek['load_state_ratio'] - 0.95))->toBeLessThan(0.0001);

    expect($highWeek['load_state'])->toBe('high');
    expect(abs($highWeek['load_state_ratio'] - 4.3))->toBeLessThan(0.0001);
    expect($highWeek['planned_sessions_count'])->toBe(1);
    expect($highWeek['planned_completed_count'])->toBe(1);
    expect($highWeek['planned_tss_total'])->toBe(100);
    expect($highWeek['completed_tss_total'])->toBe(430);
});

it('forbids compliance access for admins unless impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/progress/compliance?from=2026-02-09&to=2026-02-22')
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->getJson('/api/progress/compliance?from=2026-02-09&to=2026-02-22')
        ->assertOk();
});

it('uses linked activity fallback tss for completed weekly totals when actual tss is missing', function () {
    $athlete = User::factory()->athlete()->create();

    $session = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-04-06',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => now(),
        'duration_minutes' => 60,
        'actual_duration_minutes' => 60,
        'planned_tss' => 90,
        'actual_tss' => null,
    ]);

    Activity::factory()->linkedToTrainingSession($session)->create([
        'athlete_id' => $athlete->id,
        'sport' => 'run',
        'duration_seconds' => 3600,
        'raw_payload' => [
            'relative_effort' => 77,
        ],
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/progress/compliance?from=2026-04-06&to=2026-04-12')
        ->assertOk()
        ->json();

    expect($response['weeks'])->toHaveCount(1);
    expect($response['weeks'][0]['planned_tss_total'])->toBe(90);
    expect($response['weeks'][0]['completed_tss_total'])->toBe(77);
    expect(abs($response['weeks'][0]['load_state_ratio'] - (77 / 90)))->toBeLessThan(0.0001);
    expect($response['weeks'][0]['load_state'])->toBe('in_range');
});
