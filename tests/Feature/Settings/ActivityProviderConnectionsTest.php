<?php

use App\Models\ActivityProviderConnection;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('requires authentication for activity provider connect routes', function () {
    $this
        ->get('/settings/connections/strava/connect')
        ->assertRedirect(route('login'));
});

it('redirects authenticated users to strava oauth authorize url', function () {
    config()->set('services.strava.client_id', 'client-123');
    config()->set(
        'services.strava.redirect_uri',
        'https://endure.test/settings/connections/strava/callback',
    );
    config()->set('services.strava.scopes', ['read', 'activity:read_all']);

    $athlete = User::factory()->athlete()->create();

    $response = $this
        ->actingAs($athlete)
        ->get('/settings/connections/strava/connect');

    $response->assertRedirect();

    $location = $response->headers->get('Location');

    expect($location)->toStartWith('https://www.strava.com/oauth/authorize?');
    expect($location)->toContain('client_id=client-123');
    expect($location)->toContain(
        'redirect_uri=https%3A%2F%2Fendure.test%2Fsettings%2Fconnections%2Fstrava%2Fcallback',
    );
    expect($location)->toContain('scope=read%2Cactivity%3Aread_all');
    expect(session('activity_provider_oauth_state.strava'))->not->toBeNull();
});

it('returns an inertia location redirect for inertia connect requests', function () {
    config()->set('services.strava.client_id', 'client-123');
    config()->set(
        'services.strava.redirect_uri',
        'https://endure.test/settings/connections/strava/callback',
    );
    config()->set('services.strava.scopes', ['read', 'activity:read_all']);

    $athlete = User::factory()->athlete()->create();

    $inertiaVersion = app(\App\Http\Middleware\HandleInertiaRequests::class)
        ->version(request());

    $response = $this
        ->actingAs($athlete)
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', (string) $inertiaVersion)
        ->withHeader('X-Requested-With', 'XMLHttpRequest')
        ->get('/settings/connections/strava/connect');

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location');
    expect((string) $response->headers->get('X-Inertia-Location'))
        ->toStartWith('https://www.strava.com/oauth/authorize?');
});

it('stores tokens on callback and supports reconnect overwrites', function () {
    config()->set('services.strava.client_id', 'client-123');
    config()->set('services.strava.client_secret', 'secret-123');

    Http::fake([
        'https://www.strava.com/oauth/token' => Http::sequence()
            ->push([
                'access_token' => 'first-access-token',
                'refresh_token' => 'first-refresh-token',
                'expires_at' => now()->addHour()->timestamp,
                'athlete' => [
                    'id' => 91823,
                ],
            ])
            ->push([
                'access_token' => 'updated-access-token',
                'refresh_token' => 'updated-refresh-token',
                'expires_at' => now()->addHours(2)->timestamp,
                'athlete' => [
                    'id' => 91823,
                ],
            ]),
    ]);

    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->withSession([
            'activity_provider_oauth_state.strava' => 'state-123',
        ])
        ->get('/settings/connections/strava/callback?state=state-123&code=abc')
        ->assertRedirect('/settings/connections');

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->access_token)->toBe('first-access-token');
    expect($connection?->refresh_token)->toBe('first-refresh-token');
    expect($connection?->provider_athlete_id)->toBe('91823');
    expect($connection?->token_expires_at)->not->toBeNull();

    $this
        ->actingAs($athlete)
        ->withSession([
            'activity_provider_oauth_state.strava' => 'state-456',
        ])
        ->get('/settings/connections/strava/callback?state=state-456&code=def')
        ->assertRedirect('/settings/connections');

    $connection->refresh();
    expect($connection->access_token)->toBe('updated-access-token');
    expect($connection->refresh_token)->toBe('updated-refresh-token');

    $athlete->refresh();
    expect($athlete->strava_access_token)->toBe('updated-access-token');
    expect($athlete->strava_refresh_token)->toBe('updated-refresh-token');
});

it('disconnects strava and clears persisted tokens', function () {
    $athlete = User::factory()->athlete()->create([
        'strava_access_token' => 'legacy-access-token',
        'strava_refresh_token' => 'legacy-refresh-token',
        'strava_token_expires_at' => now()->addHour(),
    ]);

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'connection-access-token',
        'refresh_token' => 'connection-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $this
        ->actingAs($athlete)
        ->delete('/settings/connections/strava')
        ->assertRedirect('/settings/connections');

    expect(ActivityProviderConnection::query()->count())->toBe(0);

    $athlete->refresh();
    expect($athlete->strava_access_token)->toBeNull();
    expect($athlete->strava_refresh_token)->toBeNull();
    expect($athlete->strava_token_expires_at)->toBeNull();
});

it('forbids coaches from managing provider connections', function () {
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($coach)
        ->get('/settings/connections/strava/connect')
        ->assertForbidden();

    $this
        ->actingAs($coach)
        ->delete('/settings/connections/strava')
        ->assertForbidden();
});
