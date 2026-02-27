<?php

use App\Jobs\RecalculateUserLoadJob;
use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use App\Services\Load\TrainingLoadCalculator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Bus;

it('recalculates snapshots for a user window', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-05-10',
        'sport' => 'run',
        'planned_tss' => 64,
        'status' => 'planned',
    ]);

    $job = new RecalculateUserLoadJob(
        $athlete,
        Carbon::parse('2026-05-10'),
        Carbon::parse('2026-05-10'),
    );

    $job->handle(app(TrainingLoadCalculator::class));

    $this->assertDatabaseHas('training_load_snapshots', [
        'user_id' => $athlete->id,
        'date' => '2026-05-10',
        'sport' => 'combined',
    ]);
});

it('dispatches load recalculation when a session is completed', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $athlete = User::factory()->athlete()->create();
    $session = createLoadSession($athlete);
    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'sport' => 'run',
        'duration_seconds' => 3600,
        'raw_payload' => ['tss' => 58],
    ]);

    $this
        ->actingAs($athlete)
        ->postJson("/api/training-sessions/{$session->id}/complete")
        ->assertOk();

    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athlete),
    );
});

it('dispatches load recalculation when unlinking an activity', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $athlete = User::factory()->athlete()->create();
    $session = createLoadSession($athlete);
    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'sport' => 'run',
        'duration_seconds' => 3000,
    ]);

    $this
        ->actingAs($athlete)
        ->deleteJson("/api/training-sessions/{$session->id}/unlink-activity")
        ->assertOk();

    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athlete),
    );
});

it('dispatches load recalculation when planned tss changes', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $athlete = User::factory()->athlete()->create();
    $session = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-05-12',
        'sport' => 'bike',
        'status' => 'planned',
        'duration_minutes' => 75,
        'planned_tss' => 60,
    ]);

    $this
        ->actingAs($athlete)
        ->patchJson("/api/training-sessions/{$session->id}", [
            'training_week_id' => null,
            'date' => '2026-05-12',
            'sport' => 'bike',
            'title' => $session->title,
            'planned_duration_minutes' => 75,
            'planned_tss' => 92,
            'notes' => null,
            'planned_structure' => null,
        ])
        ->assertOk();

    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athlete),
    );
});

function createLoadSession(User $athlete): TrainingSession
{
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-05-08',
        'ends_at' => '2026-05-14',
    ]);

    return TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'scheduled_date' => '2026-05-10',
        'sport' => 'run',
        'status' => 'planned',
        'duration_minutes' => 60,
        'planned_tss' => 55,
    ]);
}
