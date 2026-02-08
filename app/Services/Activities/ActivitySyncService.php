<?php

namespace App\Services\Activities;

use App\Data\ActivityProviderSyncResultDTO;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use Carbon\CarbonImmutable;
use Throwable;

class ActivitySyncService
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
        private readonly ActivityProviderTokenManager $tokenManager,
        private readonly ExternalActivityPersister $persister,
    ) {}

    public function sync(User $user, string $provider): ActivityProviderSyncResultDTO
    {
        $normalizedProvider = strtolower(trim($provider));
        $providerClient = $this->providerManager->provider($normalizedProvider);

        $this->tokenManager->validAccessToken($user, $normalizedProvider);

        $connection = $this->connectionStore->ensureFromLegacy($user, $normalizedProvider);
        $afterTimestamp = $this->resolveAfterTimestamp($connection);

        $syncedActivitiesCount = 0;
        $perPage = 200;
        $page = 1;

        try {
            do {
                $activities = $providerClient->fetchActivities($user, [
                    'after' => $afterTimestamp,
                    'page' => $page,
                    'per_page' => $perPage,
                ]);

                $syncedActivitiesCount += $this->persister
                    ->persistMany($user, $activities)
                    ->count();

                $batchCount = $activities->count();
                $page++;
            } while ($batchCount === $perPage);
        } catch (Throwable $throwable) {
            $this->connectionStore->markSyncFailure(
                user: $user,
                provider: $normalizedProvider,
                failureReason: $throwable->getMessage(),
            );

            throw $throwable;
        }

        $syncedAt = CarbonImmutable::now();
        $this->connectionStore->markSyncSuccess(
            user: $user,
            provider: $normalizedProvider,
            syncedAt: $syncedAt,
        );

        return new ActivityProviderSyncResultDTO(
            provider: $normalizedProvider,
            syncedActivitiesCount: $syncedActivitiesCount,
            syncedAt: $syncedAt,
            status: 'success',
        );
    }

    private function resolveAfterTimestamp(?ActivityProviderConnection $connection): int
    {
        if (
            $connection instanceof ActivityProviderConnection
            && $connection->last_synced_at !== null
        ) {
            return $connection->last_synced_at->timestamp;
        }

        $lookbackDays = (int) config(
            'services.activity_providers.sync_lookback_days',
            90,
        );

        return CarbonImmutable::now()
            ->subDays(max(30, $lookbackDays))
            ->timestamp;
    }
}
