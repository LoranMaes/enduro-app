<?php

namespace App\Services\Activities;

use App\Jobs\SyncActivityProviderJob;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderSyncRun;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use Carbon\CarbonImmutable;

class ActivitySyncDispatcher
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
    ) {}

    /**
     * @param  array{after?: int|null, external_activity_id?: string|null}  $options
     */
    public function dispatch(
        User $user,
        string $provider,
        array $options = [],
    ): ActivityProviderSyncRun {
        $normalizedProvider = strtolower(trim($provider));

        $this->providerManager->provider($normalizedProvider);

        $connection = $this->connectionStore->ensureFromLegacy($user, $normalizedProvider);

        if (! $connection instanceof ActivityProviderConnection || trim((string) $connection->access_token) === '') {
            throw new ActivityProviderTokenMissingException($normalizedProvider);
        }

        $queuedAt = CarbonImmutable::now();

        $syncRun = ActivityProviderSyncRun::query()->create([
            'user_id' => $user->id,
            'provider' => $normalizedProvider,
            'status' => ActivityProviderSyncRun::STATUS_QUEUED,
            'queued_at' => $queuedAt,
        ]);

        $this->connectionStore->markSyncQueued($user, $normalizedProvider);

        SyncActivityProviderJob::dispatch(
            provider: $normalizedProvider,
            userId: $user->id,
            syncRunId: $syncRun->id,
            externalActivityId: $this->normalizeExternalActivityId(
                $options['external_activity_id'] ?? null,
            ),
            afterTimestamp: $this->normalizeAfterTimestamp(
                $options['after'] ?? null,
            ),
        );

        return $syncRun;
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

    private function normalizeAfterTimestamp(mixed $afterTimestamp): ?int
    {
        if (! is_numeric($afterTimestamp)) {
            return null;
        }

        return (int) $afterTimestamp;
    }
}
