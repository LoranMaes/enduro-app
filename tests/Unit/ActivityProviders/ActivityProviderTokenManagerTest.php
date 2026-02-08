<?php

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Data\OAuthProviderTokensDTO;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Contracts\OAuthProvider;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use Carbon\CarbonImmutable;
use Illuminate\Container\Container;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function (): void {
    \Mockery::close();
});

it('resolves activity and oauth providers through the provider manager', function () {
    $container = new Container;

    $container->bind(FakeActivityProvider::class, fn (): FakeActivityProvider => new FakeActivityProvider);
    $container->bind(FakeOAuthProvider::class, fn (): FakeOAuthProvider => new FakeOAuthProvider);

    $manager = new ActivityProviderManager(
        container: $container,
        activityProviderClasses: ['strava' => FakeActivityProvider::class],
        oauthProviderClasses: ['strava' => FakeOAuthProvider::class],
        allowedProviders: ['strava'],
    );

    expect($manager->provider('strava'))->toBeInstanceOf(FakeActivityProvider::class);
    expect($manager->oauthProvider('strava'))->toBeInstanceOf(FakeOAuthProvider::class);
});

it('refreshes near-expired access tokens through oauth providers', function () {
    config()->set('services.activity_providers.token_refresh_buffer_seconds', 300);

    $user = User::factory()->athlete()->make();

    $connection = new ActivityProviderConnection;
    $connection->forceFill([
        'provider' => 'strava',
        'access_token' => 'old-access-token',
        'refresh_token' => 'refresh-token',
        'token_expires_at' => now()->addSeconds(60),
    ]);

    $oauthProvider = \Mockery::mock(OAuthProvider::class);
    $oauthProvider->shouldReceive('refreshAccessToken')
        ->once()
        ->with('refresh-token')
        ->andReturn(new OAuthProviderTokensDTO(
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: CarbonImmutable::now()->addHours(2),
            providerAthleteId: '7788',
        ));

    $providerManager = \Mockery::mock(ActivityProviderManager::class);
    $providerManager->shouldReceive('oauthProvider')
        ->once()
        ->with('strava')
        ->andReturn($oauthProvider);

    $store = \Mockery::mock(ActivityProviderConnectionStore::class);
    $store->shouldReceive('ensureFromLegacy')
        ->once()
        ->with($user, 'strava')
        ->andReturn($connection);

    $refreshedConnection = new ActivityProviderConnection;
    $refreshedConnection->forceFill([
        'provider' => 'strava',
        'access_token' => 'new-access-token',
        'refresh_token' => 'new-refresh-token',
        'token_expires_at' => now()->addHours(2),
    ]);

    $store->shouldReceive('upsert')
        ->once()
        ->andReturn($refreshedConnection);

    $tokenManager = new ActivityProviderTokenManager(
        providerManager: $providerManager,
        connectionStore: $store,
    );

    expect($tokenManager->validAccessToken($user, 'strava'))
        ->toBe('new-access-token');
});

it('throws a token missing exception when no token exists for the provider', function () {
    $user = User::factory()->athlete()->make([
        'strava_access_token' => null,
    ]);

    $providerManager = \Mockery::mock(ActivityProviderManager::class);
    $store = \Mockery::mock(ActivityProviderConnectionStore::class);
    $store->shouldReceive('ensureFromLegacy')
        ->once()
        ->with($user, 'strava')
        ->andReturn(null);

    $tokenManager = new ActivityProviderTokenManager(
        providerManager: $providerManager,
        connectionStore: $store,
    );

    expect(fn () => $tokenManager->validAccessToken($user, 'strava'))
        ->toThrow(ActivityProviderTokenMissingException::class);
});

class FakeActivityProvider implements ActivityProvider
{
    public function provider(): string
    {
        return 'strava';
    }

    public function fetchActivities(User $user, array $options = []): ActivityCollection
    {
        return new ActivityCollection;
    }

    public function fetchActivity(User $user, string $externalId): ExternalActivityDTO
    {
        return new ExternalActivityDTO(
            provider: 'strava',
            external_id: $externalId,
            sport: 'run',
            started_at: CarbonImmutable::now(),
            duration_seconds: 1200,
        );
    }
}

class FakeOAuthProvider implements OAuthProvider
{
    public function provider(): string
    {
        return 'strava';
    }

    public function authorizationUrl(User $user, string $state): string
    {
        return 'https://www.strava.com/oauth/authorize?state='.$state;
    }

    public function exchangeAuthorizationCode(string $code): OAuthProviderTokensDTO
    {
        return new OAuthProviderTokensDTO(
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: CarbonImmutable::now()->addHour(),
            providerAthleteId: '100',
        );
    }

    public function refreshAccessToken(string $refreshToken): OAuthProviderTokensDTO
    {
        return new OAuthProviderTokensDTO(
            accessToken: 'refreshed-token',
            refreshToken: 'refreshed-refresh-token',
            expiresAt: CarbonImmutable::now()->addHour(),
            providerAthleteId: '100',
        );
    }
}
