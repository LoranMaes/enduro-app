<?php

namespace App\Services\ActivityProviders;

use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use Carbon\CarbonInterface;

class ActivityProviderTokenManager
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
    ) {}

    public function validAccessToken(User $user, string $provider): string
    {
        $normalizedProvider = $this->normalizeProvider($provider);
        $connection = $this->connectionStore->ensureFromLegacy($user, $normalizedProvider);

        if (! $connection instanceof ActivityProviderConnection) {
            $legacyAccessToken = $this->legacyAccessToken($user, $normalizedProvider);

            if ($legacyAccessToken !== null) {
                return $legacyAccessToken;
            }

            throw new ActivityProviderTokenMissingException($normalizedProvider);
        }

        $accessToken = trim((string) $connection->access_token);

        if ($accessToken === '') {
            throw new ActivityProviderTokenMissingException($normalizedProvider);
        }

        if (! $this->shouldRefresh($connection->token_expires_at)) {
            return $accessToken;
        }

        $refreshToken = trim((string) $connection->refresh_token);

        if ($refreshToken === '') {
            throw new ActivityProviderInvalidTokenException(
                $normalizedProvider,
                'Refresh token is missing for this provider connection.',
            );
        }

        $oauthProvider = $this->providerManager->oauthProvider($normalizedProvider);
        $tokens = $oauthProvider->refreshAccessToken($refreshToken);
        $refreshedConnection = $this->connectionStore->upsert(
            user: $user,
            provider: $normalizedProvider,
            tokens: $tokens,
        );

        return trim((string) $refreshedConnection->access_token);
    }

    private function shouldRefresh(?CarbonInterface $expiresAt): bool
    {
        if ($expiresAt === null) {
            return false;
        }

        $bufferSeconds = (int) config(
            'services.activity_providers.token_refresh_buffer_seconds',
            300,
        );

        return now()->addSeconds($bufferSeconds)->greaterThanOrEqualTo($expiresAt);
    }

    private function legacyAccessToken(User $user, string $provider): ?string
    {
        if ($provider !== 'strava') {
            return null;
        }

        $accessToken = trim((string) $user->strava_access_token);

        if ($accessToken === '') {
            return null;
        }

        return $accessToken;
    }

    private function normalizeProvider(string $provider): string
    {
        return strtolower(trim($provider));
    }
}
