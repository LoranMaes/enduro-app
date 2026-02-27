<?php

namespace App\Actions\Load;

use App\Jobs\RecalculateUserLoadJob;
use App\Jobs\RecalculateWeeklyMetricsJob;
use App\Models\User;
use Carbon\Carbon;

class DispatchRecentLoadRecalculation
{
    public function execute(
        User $user,
        int $days = 60,
        ?Carbon $from = null,
        ?Carbon $to = null,
    ): void {
        $normalizedTo = $to?->copy()->endOfDay()
            ?? Carbon::parse(now())->endOfDay();
        $normalizedFrom = $from?->copy()->startOfDay()
            ?? Carbon::parse(now())->subDays(max(1, $days) - 1)->startOfDay();

        if ($normalizedFrom->greaterThan($normalizedTo)) {
            $normalizedFrom = $normalizedTo->copy()->startOfDay();
        }

        RecalculateUserLoadJob::dispatch(
            $user,
            $normalizedFrom,
            $normalizedTo,
        );
        RecalculateWeeklyMetricsJob::dispatch(
            $user,
            $normalizedFrom,
            $normalizedTo,
        );
    }
}
