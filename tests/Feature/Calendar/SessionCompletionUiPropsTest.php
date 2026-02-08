<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders planned and completed session states in dashboard inertia props', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create([
        'starts_at' => '2026-10-01',
        'ends_at' => '2026-10-31',
    ]);
    $week = TrainingWeek::factory()->for($plan)->create([
        'starts_at' => '2026-10-01',
        'ends_at' => '2026-10-07',
    ]);

    TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-10-02',
        'sport' => 'run',
        'status' => 'planned',
        'actual_duration_minutes' => null,
        'completed_at' => null,
    ]);

    $completedSession = TrainingSession::factory()->for($week)->create([
        'scheduled_date' => '2026-10-03',
        'sport' => 'bike',
        'status' => 'completed',
        'actual_duration_minutes' => 75,
        'actual_tss' => 88,
        'completed_at' => now(),
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $completedSession->id,
        'sport' => 'bike',
    ]);

    $this
        ->actingAs($athlete)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.0.status', 'planned')
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.0.is_completed', false)
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.1.status', 'completed')
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.1.is_completed', true)
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.1.actual_duration_minutes', 75)
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.1.actual_tss', 88)
            ->where('trainingPlans.data.0.training_weeks.0.training_sessions.1.linked_activity_id', $activity->id)
            ->has('trainingPlans.data.0.training_weeks.0.training_sessions.1.completed_at')
        );
});

it('shares role context required for completion action gating', function () {
    $athlete = User::factory()->athlete()->create();
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($athlete)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('auth.user.role', 'athlete')
            ->where('auth.impersonating', false)
        );

    $this
        ->actingAs($coach)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('auth.user.role', 'coach')
            ->where('auth.impersonating', false)
        );
});
