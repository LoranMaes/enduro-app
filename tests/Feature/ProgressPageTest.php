<?php

use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\AthleteProfile;
use App\Models\TrainingSession;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for progress page', function () {
    $this->get('/progress')->assertRedirect(route('login'));
});

it('allows athletes to view training progress derived from sessions', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => now()->startOfWeek()->toDateString(),
        'status' => TrainingSessionStatus::Planned->value,
        'duration_minutes' => 60,
        'planned_tss' => 50,
        'actual_tss' => null,
    ]);

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => now()->startOfWeek()->addDay()->toDateString(),
        'status' => TrainingSessionStatus::Completed->value,
        'duration_minutes' => 90,
        'actual_duration_minutes' => 92,
        'planned_tss' => 70,
        'actual_tss' => 74,
    ]);

    $this
        ->actingAs($athlete)
        ->get('/progress?weeks=4')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('progress/index')
            ->where('range.weeks', 4)
            ->where('range.options', [4, 8, 12, 24])
            ->where('summary.planned_sessions_total', 2)
            ->where('summary.completed_sessions_total', 1)
            ->where('summary.planned_tss_total', 120)
            ->where('summary.actual_tss_total', 74)
            ->has('weeks', 4));
});

it('forbids non-athletes from training progress page', function () {
    $coach = User::factory()->coach()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($coach)->get('/progress')->assertForbidden();
    $this->actingAs($admin)->get('/progress')->assertForbidden();
});

it('uses linked activity payload TSS for actual trend when session actual_tss is missing', function () {
    $athlete = User::factory()->athlete()->create();

    $session = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => now()->startOfWeek()->toDateString(),
        'status' => TrainingSessionStatus::Planned->value,
        'duration_minutes' => 60,
        'planned_tss' => 70,
        'actual_tss' => null,
    ]);

    Activity::factory()->create([
        'training_session_id' => $session->id,
        'athlete_id' => $athlete->id,
        'sport' => 'run',
        'duration_seconds' => 3660,
        'raw_payload' => [
            'suffer_score' => 88,
        ],
    ]);

    $this
        ->actingAs($athlete)
        ->get('/progress?weeks=4')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('progress/index')
            ->where('summary.actual_tss_total', 88)
            ->where('summary.completed_sessions_total', 1));
});

it('estimates actual tss from linked activity power and ftp when payload tss is missing', function () {
    $athlete = User::factory()->athlete()->create();

    AthleteProfile::query()->create([
        'user_id' => $athlete->id,
        'ftp_watts' => 250,
    ]);

    $session = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => now()->startOfWeek()->toDateString(),
        'status' => TrainingSessionStatus::Planned->value,
        'duration_minutes' => 60,
        'planned_tss' => 70,
        'actual_tss' => null,
    ]);

    Activity::factory()->create([
        'training_session_id' => $session->id,
        'athlete_id' => $athlete->id,
        'sport' => 'bike',
        'duration_seconds' => 3600,
        'raw_payload' => [
            'weighted_average_watts' => 200,
        ],
    ]);

    $response = $this
        ->actingAs($athlete)
        ->get('/progress?weeks=4');

    $response
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('progress/index')
            ->where('summary.completed_sessions_total', 1)
            ->where('summary.actual_tss_total', 64));
});

it('includes unlinked activities in weekly actual progress totals', function () {
    $athlete = User::factory()->athlete()->create();

    Activity::factory()->create([
        'training_session_id' => null,
        'athlete_id' => $athlete->id,
        'started_at' => now()->startOfWeek()->addDays(2),
        'duration_seconds' => 3600,
        'raw_payload' => [
            'suffer_score' => 95,
        ],
    ]);

    $this
        ->actingAs($athlete)
        ->get('/progress?weeks=4')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('progress/index')
            ->where('summary.actual_tss_total', 95));
});
