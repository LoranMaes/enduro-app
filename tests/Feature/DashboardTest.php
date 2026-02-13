<?php

use App\Models\Goal;
use App\Models\TrainingSession;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns calendar sessions and window even when athlete has no plans', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('trainingPlans.meta.total', 0)
            ->where('trainingSessions.data', [])
            ->has('calendarWindow.starts_at')
            ->has('calendarWindow.ends_at'));
});

test('dashboard includes plan-less sessions in calendar payload', function () {
    $athlete = User::factory()->athlete()->create();
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-08-05',
        'sport' => 'run',
    ]);

    $this
        ->actingAs($athlete)
        ->get(route('dashboard', [
            'starts_from' => '2026-08-01',
            'ends_to' => '2026-08-31',
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('trainingSessions.data.0.training_week_id', null)
            ->where('trainingSessions.data.0.scheduled_date', '2026-08-05')
            ->where('trainingSessions.data.0.sport', 'run'));
});

test('dashboard includes goals in calendar payload window', function () {
    $athlete = User::factory()->athlete()->create();
    Goal::factory()->for($athlete)->create([
        'title' => 'Spring target',
        'target_date' => '2026-05-10',
    ]);

    $this
        ->actingAs($athlete)
        ->get(route('dashboard', [
            'starts_from' => '2026-05-01',
            'ends_to' => '2026-05-31',
        ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('goals.data.0.title', 'Spring target')
            ->where('goals.data.0.target_date', '2026-05-10'));
});
