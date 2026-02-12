<?php

namespace App\Services\Activities;

use App\Data\ActivityProviderSyncResultDTO;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use App\Services\Training\ActivityToSessionReconciler;
use Carbon\CarbonImmutable;

class ActivitySyncService
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
        private readonly ActivityProviderTokenManager $tokenManager,
        private readonly ExternalActivityPersister $persister,
        private readonly ActivityToSessionReconciler $activityToSessionReconciler,
    ) {}

    /**
     * @param  array{after?: int|null, external_activity_id?: string|null, per_page?: int|null}  $options
     */
    public function sync(
        User $user,
        string $provider,
        array $options = [],
    ): ActivityProviderSyncResultDTO {
        $normalizedProvider = strtolower(trim($provider));
        $providerClient = $this->providerManager->provider($normalizedProvider);
        $externalActivityId = $this->normalizeExternalActivityId(
            $options['external_activity_id'] ?? null,
        );

        $this->tokenManager->validAccessToken($user, $normalizedProvider);

        $connection = $this->connectionStore->ensureFromLegacy($user, $normalizedProvider);
        $afterTimestamp = $this->resolveAfterTimestamp(
            connection: $connection,
            afterTimestamp: $options['after'] ?? null,
        );

        if ($externalActivityId !== null) {
            $activity = $providerClient->fetchActivity($user, $externalActivityId);
            $persistedActivity = $this->persister->persist($user, $activity);
            $this->activityToSessionReconciler->reconcile($persistedActivity);

            $syncedAt = CarbonImmutable::now();

            return new ActivityProviderSyncResultDTO(
                provider: $normalizedProvider,
                syncedActivitiesCount: 1,
                syncedAt: $syncedAt,
                status: 'success',
            );
        }

        $syncedActivitiesCount = 0;
        $perPage = $this->resolvePerPage($options['per_page'] ?? null);
        $page = 1;

        do {
            $activities = $providerClient->fetchActivities($user, [
                'after' => $afterTimestamp,
                'page' => $page,
                'per_page' => $perPage,
            ]);

            $persistedActivities = $this->persister
                ->persistMany($user, $activities)
                ->values();
            $syncedActivitiesCount += $persistedActivities->count();
            $this->activityToSessionReconciler->reconcileMany($persistedActivities);

            $batchCount = $activities->count();
            $page++;
        } while ($batchCount === $perPage);

        $syncedAt = CarbonImmutable::now();

        return new ActivityProviderSyncResultDTO(
            provider: $normalizedProvider,
            syncedActivitiesCount: $syncedActivitiesCount,
            syncedAt: $syncedAt,
            status: 'success',
        );
    }

    private function resolveAfterTimestamp(
        ?ActivityProviderConnection $connection,
        mixed $afterTimestamp,
    ): int {
        if (is_numeric($afterTimestamp)) {
            return (int) $afterTimestamp;
        }

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

    private function resolvePerPage(mixed $perPage): int
    {
        if (! is_numeric($perPage)) {
            return 200;
        }

        return max(1, min(200, (int) $perPage));
    }

    private function normalizeExternalActivityId(mixed $externalActivityId): ?string
    {
        if (! is_scalar($externalActivityId)) {
            return null;
        }

        $normalizedExternalActivityId = trim((string) $externalActivityId);

        if ($normalizedExternalActivityId === '') {
            return null;
        }

        return $normalizedExternalActivityId;
    }
}
