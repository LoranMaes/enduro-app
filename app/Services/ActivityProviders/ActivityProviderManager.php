<?php

namespace App\Services\ActivityProviders;

use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Contracts\Container\Container;

class ActivityProviderManager
{
    /**
     * @var array<string, class-string<ActivityProvider>>
     */
    private array $providerClasses;

    /**
     * @var list<string>
     */
    private array $allowedProviders;

    /**
     * @param  array<string, class-string<ActivityProvider>>  $providerClasses
     * @param  list<string>  $allowedProviders
     */
    public function __construct(
        private readonly Container $container,
        array $providerClasses,
        array $allowedProviders = [],
    ) {
        $normalizedProviderClasses = [];

        foreach ($providerClasses as $provider => $className) {
            $normalizedProviderClasses[strtolower($provider)] = $className;
        }

        $this->providerClasses = $normalizedProviderClasses;
        $this->allowedProviders = $allowedProviders !== []
            ? array_values(array_unique(array_map('strtolower', $allowedProviders)))
            : array_keys($normalizedProviderClasses);
    }

    public function provider(string $provider): ActivityProvider
    {
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

        $providerClass = $this->providerClasses[$normalizedProvider] ?? null;

        if ($providerClass === null) {
            throw new UnsupportedActivityProviderException(
                $normalizedProvider,
                $this->allowedProviders,
            );
        }

        $providerInstance = $this->container->make($providerClass);

        if (! $providerInstance instanceof ActivityProvider) {
            throw new UnsupportedActivityProviderException(
                $normalizedProvider,
                $this->allowedProviders,
            );
        }

        return $providerInstance;
    }

    public function resolve(string $provider): ActivityProvider
    {
        return $this->provider($provider);
    }

    /**
     * @return list<string>
     */
    public function allowedProviders(): array
    {
        return $this->allowedProviders;
    }
}
