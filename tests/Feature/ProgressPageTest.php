<?php

use App\Enums\TrainingSessionStatus;
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
