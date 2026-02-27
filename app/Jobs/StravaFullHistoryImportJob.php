<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Activities\ExternalActivityPersister;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class StravaFullHistoryImportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly int $perPage = 200,
    ) {}

    public function handle(
        ActivityProviderManager $activityProviderManager,
        ExternalActivityPersister $externalActivityPersister,
    ): void {
        $athlete = User::query()->find($this->user->id);

        if (! $athlete instanceof User || ! $athlete->isAthlete()) {
            return;
        }

        $provider = $activityProviderManager->provider('strava');

        if (! $provider instanceof ActivityProvider) {
            return;
        }

        $page = 1;
        $normalizedPerPage = max(1, min(200, $this->perPage));

        while (true) {
            $batch = $provider->fetchActivities($athlete, [
                'page' => $page,
                'per_page' => $normalizedPerPage,
            ]);

            if ($batch->isEmpty()) {
                break;
            }

            $persistedActivities = $externalActivityPersister->persistMany(
                $athlete,
                $batch,
            );
            $batchStart = $persistedActivities
                ->pluck('started_at')
                ->filter()
                ->sort()
                ->first();

            if ($batchStart !== null) {
                RecalculateUserLoadJob::dispatch(
                    $athlete,
                    Carbon::parse($batchStart)->startOfDay(),
                    Carbon::parse(now())->endOfDay(),
                );
                RecalculateWeeklyMetricsJob::dispatch(
                    $athlete,
                    Carbon::parse($batchStart)->startOfDay(),
                    Carbon::parse(now())->endOfDay(),
                );
            }

            if ($batch->count() < $normalizedPerPage) {
                break;
            }

            $page++;
        }
    }
}
