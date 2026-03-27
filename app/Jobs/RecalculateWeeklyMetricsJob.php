<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Metrics\WeeklyMetricsSnapshotService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateWeeklyMetricsJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $uniqueFor = 300;

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

    public function uniqueId(): string
    {
        return implode(':', [
            'recalculate-weekly-metrics',
            (string) $this->user->id,
            $this->from->copy()->startOfDay()->format('Y-m-d'),
            $this->to->copy()->endOfDay()->format('Y-m-d'),
        ]);
    }
}
