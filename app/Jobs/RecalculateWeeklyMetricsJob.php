<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Metrics\WeeklyMetricsSnapshotService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateWeeklyMetricsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Carbon $from,
        public readonly Carbon $to,
    ) {}

    public function handle(WeeklyMetricsSnapshotService $weeklyMetricsSnapshotService): void
    {
        $athlete = User::query()->find($this->user->id);

        if (! $athlete instanceof User || ! $athlete->isAthlete()) {
            return;
        }

        $weeklyMetricsSnapshotService->recalculateForUser(
            $athlete,
            $this->from->copy(),
            $this->to->copy(),
        );
    }
}
