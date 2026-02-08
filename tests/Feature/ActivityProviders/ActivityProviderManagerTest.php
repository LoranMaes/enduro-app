<?php

use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use App\Services\ActivityProviders\Strava\StravaActivityProvider;
use App\Services\ActivityProviders\Strava\StravaOAuthProvider;

it('resolves configured providers from the manager', function () {
    $manager = app(ActivityProviderManager::class);

    $provider = $manager->provider('strava');
    $oauthProvider = $manager->oauthProvider('strava');

    expect($provider)->toBeInstanceOf(StravaActivityProvider::class);
    expect($oauthProvider)->toBeInstanceOf(StravaOAuthProvider::class);
    expect($provider->provider())->toBe('strava');
    expect($oauthProvider->provider())->toBe('strava');
    expect($manager->allowedProviders())->toContain('strava');
});

it('throws a clear exception for unsupported providers', function () {
    $manager = app(ActivityProviderManager::class);

    expect(fn () => $manager->provider('garmin'))
        ->toThrow(UnsupportedActivityProviderException::class);

    try {
        $manager->provider('garmin');
    } catch (UnsupportedActivityProviderException $exception) {
        expect($exception->getMessage())
            ->toContain('Unsupported activity provider [garmin].');
    }
});
