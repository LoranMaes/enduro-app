<?php

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for athlete activity detail page', function () {
    $activity = Activity::factory()->create();

    $this->get("/activity-details/{$activity->id}")
        ->assertRedirect(route('login'));
});

it('renders athlete activity detail page for unlinked owned activities', function () {
    $athlete = User::factory()->athlete()->create();

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
        'provider' => 'strava',
        'external_id' => 'activity-12345',
        'sport' => 'run',
        'started_at' => '2026-02-09 07:00:00',
        'duration_seconds' => 3600,
    ]);

    $this->actingAs($athlete)
        ->get("/activity-details/{$activity->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('calendar/session-detail')
            ->where('isActivityOnly', true)
            ->where('session.sport', 'run')
            ->where('session.linked_activity_id', $activity->id)
            ->has('providerStatus')
        );
});

it('redirects linked activities to the linked session detail', function () {
    $athlete = User::factory()->athlete()->create();
    $plan = TrainingPlan::factory()->for($athlete)->create();
    $week = TrainingWeek::factory()->for($plan)->create();
    $session = TrainingSession::factory()->for($week)->create([
        'user_id' => $athlete->id,
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => $session->id,
    ]);

    $this->actingAs($athlete)
        ->get("/activity-details/{$activity->id}")
        ->assertRedirect("/sessions/{$session->id}");
});

it('forbids non-athletes from the athlete activity detail page', function () {
    $coach = User::factory()->coach()->create();
    $athlete = User::factory()->athlete()->create();

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'training_session_id' => null,
    ]);

    $this->actingAs($coach)
        ->get("/activity-details/{$activity->id}")
        ->assertForbidden();
});
