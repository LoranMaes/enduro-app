<?php

use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('requires authentication for activity provider sync endpoint', function () {
    $this
        ->postJson('/api/activity-providers/strava/sync')
        ->assertUnauthorized();
});

it('requires an existing provider connection before syncing', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertUnprocessable()
        ->assertJsonPath(
            'message',
            'Activity provider [strava] access token is missing for this user.',
        );
});

it('syncs recent activities for connected athletes', function () {
    Http::fake([
        'https://www.strava.com/api/v3/athlete/activities*' => Http::response([
            [
                'id' => 812345,
                'sport_type' => 'Run',
                'start_date' => '2026-02-06T07:00:00Z',
                'elapsed_time' => 3600,
                'distance' => 10100,
                'total_elevation_gain' => 110,
            ],
        ]),
    ]);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $response = $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync');

    $response
        ->assertOk()
        ->assertJsonPath('provider', 'strava')
        ->assertJsonPath('synced_activities_count', 1)
        ->assertJsonPath('status', 'success');

    $this->assertDatabaseHas('activities', [
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
        'external_id' => '812345',
        'sport' => 'run',
        'duration_seconds' => 3600,
    ]);

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->last_synced_at)->not->toBeNull();
    expect($connection?->last_sync_status)->toBe('success');
});

it('allows admins to trigger activity sync for their connected account', function () {
    Http::fake([
        'https://www.strava.com/api/v3/athlete/activities*' => Http::response([], 200),
    ]);

    $admin = User::factory()->admin()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $admin->id,
        'provider' => 'strava',
        'access_token' => 'admin-access-token',
        'refresh_token' => 'admin-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $this
        ->actingAs($admin)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertOk()
        ->assertJsonPath('provider', 'strava');
});

it('forbids coaches from syncing activity providers', function () {
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($coach)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertForbidden();
});

it('rejects unsupported providers', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/garmin/sync')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['provider']);
});

it('sync endpoint is idempotent for duplicate external activities', function () {
    Http::fake([
        'https://www.strava.com/api/v3/athlete/activities*' => Http::response([
            [
                'id' => 998877,
                'sport_type' => 'Ride',
                'start_date' => '2026-02-06T07:00:00Z',
                'elapsed_time' => 5400,
                'distance' => 46000,
                'total_elevation_gain' => 580,
            ],
        ], 200),
    ]);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertOk();
    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertOk();

    expect(Activity::query()->count())->toBe(1);
});
