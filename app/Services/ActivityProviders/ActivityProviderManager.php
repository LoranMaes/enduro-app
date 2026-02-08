<?php

namespace App\Services\ActivityProviders;

use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Contracts\OAuthProvider;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Contracts\Container\Container;

class ActivityProviderManager
{
    /**
     * @var array<string, class-string<ActivityProvider>>
     */
    private array $activityProviderClasses;

    /**
     * @var array<string, class-string<OAuthProvider>>
     */
    private array $oauthProviderClasses;

    /**
     * @var list<string>
     */
    private array $allowedProviders;

    /**
     * @param  array<string, class-string<ActivityProvider>>  $activityProviderClasses
     * @param  array<string, class-string<OAuthProvider>>  $oauthProviderClasses
     * @param  list<string>  $allowedProviders
     */
    public function __construct(
        private readonly Container $container,
        array $activityProviderClasses,
        array $oauthProviderClasses = [],
        array $allowedProviders = [],
    ) {
        $normalizedActivityProviderClasses = [];

        foreach ($activityProviderClasses as $provider => $className) {
            $normalizedActivityProviderClasses[strtolower($provider)] = $className;
        }

        $normalizedOAuthProviderClasses = [];

        foreach ($oauthProviderClasses as $provider => $className) {
            $normalizedOAuthProviderClasses[strtolower($provider)] = $className;
        }

        $this->activityProviderClasses = $normalizedActivityProviderClasses;
        $this->oauthProviderClasses = $normalizedOAuthProviderClasses;
        $this->allowedProviders = $allowedProviders !== []
            ? array_values(array_unique(array_map('strtolower', $allowedProviders)))
            : array_values(array_unique(array_merge(
                array_keys($normalizedActivityProviderClasses),
                array_keys($normalizedOAuthProviderClasses),
            )));
    }

    public function provider(string $provider): ActivityProvider
    {
        /** @var ActivityProvider $providerInstance */
        $providerInstance = $this->resolveProviderInstance(
            provider: $provider,
            providerClasses: $this->activityProviderClasses,
            expectedInterface: ActivityProvider::class,
        );

        return $providerInstance;
    }

    public function oauthProvider(string $provider): OAuthProvider
    {
        /** @var OAuthProvider $providerInstance */
        $providerInstance = $this->resolveProviderInstance(
            provider: $provider,
            providerClasses: $this->oauthProviderClasses,
            expectedInterface: OAuthProvider::class,
        );

        return $providerInstance;
    }

    public function resolve(string $provider): ActivityProvider
    {
        return $this->provider($provider);
    }

    public function resolveOAuth(string $provider): OAuthProvider
    {
        return $this->oauthProvider($provider);
    }

    /**
     * @return list<string>
     */
    public function allowedProviders(): array
    {
        return $this->allowedProviders;
    }

    /**
     * @param  array<string, class-string>  $providerClasses
     */
    private function resolveProviderInstance(
        string $provider,
        array $providerClasses,
        string $expectedInterface,
    ): ActivityProvider|OAuthProvider {
        $normalizedProvider = strtolower(trim($provider));

        if ($normalizedProvider === '') {
            throw new UnsupportedActivityProviderException(
                $provider,
                $this->allowedProviders,
            );
        }

        if (! in_array($normalizedProvider, $this->allowedProviders, true)) {
            throw new UnsupportedActivityProviderException(
                $normalizedProvider,
                $this->allowedProviders,
            );
        }

        $providerClass = $providerClasses[$normalizedProvider] ?? null;

        if ($providerClass === null) {
            throw new UnsupportedActivityProviderException(
                $normalizedProvider,
                $this->allowedProviders,
            );
        }

        $providerInstance = $this->container->make($providerClass);

        if (! $providerInstance instanceof $expectedInterface) {
            throw new UnsupportedActivityProviderException(
                $normalizedProvider,
                $this->allowedProviders,
            );
        }

        return $providerInstance;
    }
}
