<?php

namespace App\Jobs;

use App\Models\ActivityProviderSyncRun;
use App\Models\User;
use App\Services\Activities\ActivitySyncService;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Throwable;

class SyncActivityProviderJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 5;

    public function __construct(
        public readonly string $provider,
        public readonly int $userId,
        public readonly ?int $syncRunId = null,
        public readonly ?string $externalActivityId = null,
        public readonly ?int $afterTimestamp = null,
    ) {}

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [60, 180, 600, 1800];
    }

    public function handle(
        ActivitySyncService $activitySyncService,
        ActivityProviderConnectionStore $connectionStore,
    ): void {
        $lock = Cache::lock(
            $this->lockKey(),
            (int) config('services.activity_providers.sync_lock_seconds', 300),
        );

        if (! $lock->get()) {
            $this->release((int) config('services.activity_providers.lock_retry_seconds', 30));

            return;
        }

        try {
            $user = User::query()->find($this->userId);

            if (! $user instanceof User) {
                $this->markRunFailed('Sync user does not exist.');

                return;
            }

            $connectionStore->markSyncRunning($user, $this->provider);
            $this->markRunRunning();

            $result = $activitySyncService->sync(
                user: $user,
                provider: $this->provider,
                options: [
                    'external_activity_id' => $this->externalActivityId,
                    'after' => $this->afterTimestamp,
                ],
            );

            $connectionStore->markSyncSuccess(
                user: $user,
                provider: $this->provider,
                syncedAt: $result->syncedAt,
            );

            $this->markRunSuccess($result->syncedActivitiesCount, $result->syncedAt);
        } catch (ActivityProviderRateLimitedException $exception) {
            $user = User::query()->find($this->userId);

            if ($user instanceof User) {
                $connectionStore->markSyncRateLimited(
                    user: $user,
                    provider: $this->provider,
                    failureReason: $exception->getMessage(),
                );
            }

            $this->markRunRateLimited($exception->getMessage());

            $this->release($this->resolveRateLimitDelay($exception));
        } catch (Throwable $throwable) {
            $user = User::query()->find($this->userId);

            if ($user instanceof User) {
                $connectionStore->markSyncFailure(
                    user: $user,
                    provider: $this->provider,
                    failureReason: $throwable->getMessage(),
                );
            }

            $this->markRunFailed($throwable->getMessage());

            throw $throwable;
        } finally {
            $lock->release();
        }
    }

    private function lockKey(): string
    {
        return "activity-sync:{$this->provider}:{$this->userId}";
    }

    private function resolveRateLimitDelay(ActivityProviderRateLimitedException $exception): int
    {
        $retryAfterSeconds = $exception->retryAfterSeconds();

        if ($retryAfterSeconds !== null && $retryAfterSeconds > 0) {
            return $retryAfterSeconds;
        }

        $attempt = max(1, $this->attempts());

        return min(3600, (int) (60 * (2 ** ($attempt - 1))));
    }

    private function markRunRunning(): void
    {
        $syncRun = $this->syncRun();

        if (! $syncRun instanceof ActivityProviderSyncRun) {
            return;
        }

        $syncRun->forceFill([
            'status' => ActivityProviderSyncRun::STATUS_RUNNING,
            'reason' => null,
            'started_at' => CarbonImmutable::now(),
            'finished_at' => null,
        ])->save();
    }

    private function markRunSuccess(int $importedCount, CarbonImmutable $finishedAt): void
    {
        $syncRun = $this->syncRun();

        if (! $syncRun instanceof ActivityProviderSyncRun) {
            return;
        }

        $syncRun->forceFill([
            'status' => ActivityProviderSyncRun::STATUS_SUCCESS,
            'reason' => null,
            'imported_count' => $importedCount,
            'finished_at' => $finishedAt,
        ])->save();
    }

    private function markRunRateLimited(string $reason): void
    {
        $syncRun = $this->syncRun();

        if (! $syncRun instanceof ActivityProviderSyncRun) {
            return;
        }

        $syncRun->forceFill([
            'status' => ActivityProviderSyncRun::STATUS_RATE_LIMITED,
            'reason' => $reason,
        ])->save();
    }

    private function markRunFailed(string $reason): void
    {
        $syncRun = $this->syncRun();

        if (! $syncRun instanceof ActivityProviderSyncRun) {
            return;
        }

        $syncRun->forceFill([
            'status' => ActivityProviderSyncRun::STATUS_FAILED,
            'reason' => $reason,
            'finished_at' => CarbonImmutable::now(),
        ])->save();
    }

    private function syncRun(): ?ActivityProviderSyncRun
    {
        if ($this->syncRunId === null) {
            return null;
        }

        return ActivityProviderSyncRun::query()->find($this->syncRunId);
    }
}
