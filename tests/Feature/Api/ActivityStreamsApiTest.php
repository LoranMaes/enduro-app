<?php

use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('requires authentication for activity streams endpoint', function () {
    $activity = Activity::factory()->create();

    $this->getJson("/api/activities/{$activity->id}/streams")
        ->assertUnauthorized();
});

it('allows athletes to read normalized stream payload for own activities', function () {
    $athlete = User::factory()->athlete()->create([
        'strava_access_token' => 'strava-token',
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
        'external_id' => '12345',
        'raw_payload' => [
            'map' => [
                'summary_polyline' => 'y_jwF~kbkV??',
            ],
        ],
    ]);

    Http::fake([
        'https://www.strava.com/api/v3/activities/12345/streams*' => Http::response([
            'heartrate' => [
                'data' => [120, 125, 132],
            ],
            'watts' => [
                'data' => [210, 240, 250],
            ],
            'cadence' => [
                'data' => [80, 84, 88],
            ],
            'altitude' => [
                'data' => [10, 20, 15],
            ],
            'time' => [
                'data' => [0, 60, 120],
            ],
            'latlng' => [
                'data' => [
                    [51.0, 4.0],
                    [51.01, 4.01],
                ],
            ],
        ], 200),
    ]);

    $this
        ->actingAs($athlete)
        ->getJson("/api/activities/{$activity->id}/streams")
        ->assertOk()
        ->assertJsonPath('data.provider', 'strava')
        ->assertJsonPath('data.external_id', '12345')
        ->assertJsonPath('data.streams.heart_rate.0', 120)
        ->assertJsonPath('data.streams.power.1', 240)
        ->assertJsonPath('data.streams.cadence.2', 88)
        ->assertJsonPath('data.streams.elevation.1', 20)
        ->assertJsonPath('data.summary_polyline', 'y_jwF~kbkV??')
        ->assertJsonPath('data.default_enabled_streams.0', 'heart_rate');
});

it('forbids athletes from reading stream payload for another athletes activity', function () {
    $athlete = User::factory()->athlete()->create();
    $otherAthlete = User::factory()->athlete()->create();

    $activity = Activity::factory()->create([
        'athlete_id' => $otherAthlete->id,
        'provider' => 'strava',
    ]);

    $this
        ->actingAs($athlete)
        ->getJson("/api/activities/{$activity->id}/streams")
        ->assertForbidden();
});
