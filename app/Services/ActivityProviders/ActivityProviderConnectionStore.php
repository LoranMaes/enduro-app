<?php

namespace App\Services\ActivityProviders;

use App\Data\OAuthProviderTokensDTO;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use Carbon\CarbonImmutable;

class ActivityProviderConnectionStore
{
    public function find(User $user, string $provider): ?ActivityProviderConnection
    {
        return ActivityProviderConnection::query()
            ->where('user_id', $user->id)
            ->where('provider', $this->normalizeProvider($provider))
            ->first();
    }

    public function ensureFromLegacy(User $user, string $provider): ?ActivityProviderConnection
    {
        $normalizedProvider = $this->normalizeProvider($provider);
        $existingConnection = $this->find($user, $normalizedProvider);

        if ($existingConnection instanceof ActivityProviderConnection) {
            return $existingConnection;
        }

        if ($normalizedProvider !== 'strava') {
            return null;
        }

        $accessToken = trim((string) $user->strava_access_token);

        if ($accessToken === '') {
            return null;
        }

        return ActivityProviderConnection::query()->create([
            'user_id' => $user->id,
            'provider' => $normalizedProvider,
            'access_token' => $accessToken,
            'refresh_token' => $user->strava_refresh_token,
            'token_expires_at' => $user->strava_token_expires_at,
        ]);
    }

    public function upsert(
        User $user,
        string $provider,
        OAuthProviderTokensDTO $tokens,
    ): ActivityProviderConnection {
        $normalizedProvider = $this->normalizeProvider($provider);
        $existingConnection = $this->find($user, $normalizedProvider);

        $connection = ActivityProviderConnection::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => $normalizedProvider,
            ],
            [
                'access_token' => $tokens->accessToken,
                'refresh_token' => $tokens->refreshToken
                    ?? $existingConnection?->refresh_token,
                'token_expires_at' => $tokens->expiresAt,
                'provider_athlete_id' => $tokens->providerAthleteId
                    ?? $existingConnection?->provider_athlete_id,
            ],
        );

        $this->syncLegacyColumns($user, $normalizedProvider, $connection);

        return $connection;
    }

    public function disconnect(User $user, string $provider): void
    {
        $normalizedProvider = $this->normalizeProvider($provider);

        ActivityProviderConnection::query()
            ->where('user_id', $user->id)
            ->where('provider', $normalizedProvider)
            ->delete();

        if ($normalizedProvider === 'strava') {
            $user->forceFill([
                'strava_access_token' => null,
                'strava_refresh_token' => null,
                'strava_token_expires_at' => null,
            ])->save();
        }
    }

    public function markSyncSuccess(
        User $user,
        string $provider,
        CarbonImmutable $syncedAt,
    ): void {
        $connection = $this->ensureFromLegacy($user, $provider);

        if (! $connection instanceof ActivityProviderConnection) {
            return;
        }

        $connection->forceFill([
            'last_synced_at' => $syncedAt,
            'last_sync_status' => 'success',
            'last_sync_reason' => null,
        ])->save();
    }

    public function markSyncFailure(
        User $user,
        string $provider,
        string $failureReason,
    ): void {
        $connection = $this->ensureFromLegacy($user, $provider);

        if (! $connection instanceof ActivityProviderConnection) {
            return;
        }

        $connection->forceFill([
            'last_sync_status' => 'failed',
            'last_sync_reason' => $failureReason,
        ])->save();
    }

    private function syncLegacyColumns(
        User $user,
        string $provider,
        ActivityProviderConnection $connection,
    ): void {
        if ($provider !== 'strava') {
            return;
        }

        $user->forceFill([
            'strava_access_token' => $connection->access_token,
            'strava_refresh_token' => $connection->refresh_token,
            'strava_token_expires_at' => $connection->token_expires_at,
        ])->save();
    }

    private function normalizeProvider(string $provider): string
    {
        return strtolower(trim($provider));
    }
}
