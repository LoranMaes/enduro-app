<?php

use App\Enums\TrainingSessionPlanningSource;
use App\Models\TrainingSession;
use App\Models\User;

it('returns weekly compliance using planned sessions only', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-10',
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 30,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-11',
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => null,
        'actual_duration_minutes' => null,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-11',
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 20,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-02-18',
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'completed_at' => now(),
        'actual_duration_minutes' => 40,
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
    expect($firstWeek['completed_duration_minutes_total'])->toBe(30);
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
test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
