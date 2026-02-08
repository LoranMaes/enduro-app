<?php

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Models\User;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Strava\StravaActivityProvider;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;

it('maps strava activities to normalized dto objects', function () {
    Http::fake([
        'https://www.strava.com/api/v3/athlete/activities*' => Http::response([
            [
                'id' => 9483721,
                'sport_type' => 'Run',
                'start_date' => '2026-02-08T07:15:00Z',
                'elapsed_time' => 3600,
                'distance' => 12500.5,
                'total_elevation_gain' => 152.4,
            ],
        ]),
    ]);

    $user = User::factory()->athlete()->create([
        'strava_access_token' => 'strava-token-value',
    ]);

    $provider = app(StravaActivityProvider::class);
    $activities = $provider->fetchActivities($user, ['per_page' => 10]);
    $activity = $activities->first();

    expect($activities)->toBeInstanceOf(ActivityCollection::class);
    expect($activity)->toBeInstanceOf(ExternalActivityDTO::class);
    expect($activity->provider)->toBe('strava');
    expect($activity->external_id)->toBe('9483721');
    expect($activity->sport)->toBe('run');
    expect($activity->started_at->equalTo(CarbonImmutable::parse('2026-02-08T07:15:00Z')))->toBeTrue();
    expect($activity->duration_seconds)->toBe(3600);
    expect($activity->distance_meters)->toBe(12500.5);
    expect($activity->elevation_gain_meters)->toBe(152.4);

    Http::assertSent(function (\Illuminate\Http\Client\Request $request): bool {
        return $request->url() === 'https://www.strava.com/api/v3/athlete/activities?per_page=10'
            && $request->hasHeader('Authorization', 'Bearer strava-token-value');
    });
});

it('fails when strava token is missing', function () {
    $user = User::factory()->athlete()->create([
        'strava_access_token' => null,
    ]);

    $provider = app(StravaActivityProvider::class);

    expect(fn () => $provider->fetchActivities($user))
        ->toThrow(ActivityProviderTokenMissingException::class);
});

it('throws explicit invalid-token exception when strava returns unauthorized', function () {
    Http::fake([
        'https://www.strava.com/api/v3/activities/*' => Http::response([
            'message' => 'Authorization Error',
        ], 401),
    ]);

    $user = User::factory()->athlete()->create([
        'strava_access_token' => 'expired-token',
    ]);

    $provider = app(StravaActivityProvider::class);

    expect(fn () => $provider->fetchActivity($user, '12345'))
        ->toThrow(ActivityProviderInvalidTokenException::class);
});
