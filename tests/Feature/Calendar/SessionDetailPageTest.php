<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for athlete session detail page', function () {
    $session = TrainingSession::factory()->create();

    $this->get("/sessions/{$session->id}")
        ->assertRedirect(route('login'));
});

it('renders athlete session detail page for owned sessions', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();

    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
        'status' => 'completed',
        'scheduled_date' => '2026-02-09',
        'sport' => 'bike',
        'planned_structure' => [
            'unit' => 'ftp_percent',
            'mode' => 'range',
            'steps' => [
                [
                    'id' => 'step-1',
                    'type' => 'warmup',
                    'duration_minutes' => 10,
                    'target' => null,
                    'range_min' => 55,
                    'range_max' => 65,
                    'repeat_count' => 1,
                    'note' => null,
                ],
            ],
        ],
    ]);

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
        'provider' => 'strava',
        'external_id' => 'stream-1',
    ]);

    $this
        ->actingAs($athlete)
        ->get("/sessions/{$session->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('calendar/session-detail')
            ->where('session.id', $session->id)
            ->where('session.sport', 'bike')
            ->where('session.planned_structure.unit', 'ftp_percent')
            ->where('session.linked_activity_id', fn (int $value): bool => $value > 0)
            ->has('providerStatus')
        );
});

it('forbids non-athletes from athlete session detail page', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
    ]);

    $this
        ->actingAs($coach)
        ->get("/sessions/{$session->id}")
        ->assertForbidden();
});
