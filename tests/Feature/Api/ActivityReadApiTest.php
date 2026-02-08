<?php

use App\Models\Activity;
use App\Models\User;

it('requires authentication for activity read endpoints', function () {
    $activity = Activity::factory()->create();

    $this->getJson('/api/activities')->assertUnauthorized();
    $this->getJson("/api/activities/{$activity->id}")->assertUnauthorized();
});

it('allows athletes to read only their own activities', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $ownActivity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
    ]);
    Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'provider' => 'strava',
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/activities');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $ownActivity->id);
});

it('forbids athletes from reading another athletes activity', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $otherActivity = Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
    ]);

    $this
        ->actingAs($athlete)
        ->getJson("/api/activities/{$otherActivity->id}")
        ->assertForbidden();
});

it('allows admins to read all activities', function () {
    $admin = User::factory()->admin()->create();
    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();

    Activity::factory()->create([
        'athlete_id' => $athleteOne->id,
    ]);
    Activity::factory()->create([
        'athlete_id' => $athleteTwo->id,
    ]);

    $response = $this
        ->actingAs($admin)
        ->getJson('/api/activities');

    $response->assertOk();
    $response->assertJsonCount(2, 'data');
    $response->assertJsonStructure([
        'data',
        'links',
        'meta' => [
            'current_page',
            'last_page',
            'per_page',
            'total',
        ],
    ]);
});

it('allows coaches to read assigned athlete activities only', function () {
    $coach = User::factory()->coach()->create();
    $assignedAthlete = User::factory()->athlete()->create();
    $unassignedAthlete = User::factory()->athlete()->create();

    $coach->coachedAthletes()->attach($assignedAthlete->id);

    $assignedActivity = Activity::factory()->create([
        'athlete_id' => $assignedAthlete->id,
    ]);
    Activity::factory()->create([
        'athlete_id' => $unassignedAthlete->id,
    ]);

    $response = $this
        ->actingAs($coach)
        ->getJson('/api/activities');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $assignedActivity->id);
});

it('filters activities by provider and date window', function () {
    $athlete = User::factory()->athlete()->create();

    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
        'started_at' => '2026-03-10 07:30:00',
    ]);
    Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
        'started_at' => '2026-04-10 07:30:00',
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/activities?provider=strava&from=2026-03-01&to=2026-03-31');

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.provider', 'strava');
});

it('rejects unsupported provider filters', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->getJson('/api/activities?provider=garmin')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['provider']);
});
