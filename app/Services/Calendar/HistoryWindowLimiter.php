<?php

namespace App\Services\Calendar;

use App\Models\User;
use Carbon\CarbonImmutable;
use Laravel\Pennant\Feature;

class HistoryWindowLimiter
{
    public function minimumAllowedStart(User $user): ?CarbonImmutable
    {
        if (Feature::for($user)->active('calendar.history.full_depth')) {
            return null;
        }

        $freeHistoryWeeks = max(1, (int) config('subscription-features.history.free_weeks', 8));

        return CarbonImmutable::today()
            ->startOfWeek()
            ->subWeeks($freeHistoryWeeks);
    }

    public function clampDate(User $user, ?string $date): ?string
    {
        if ($date === null) {
            return null;
        }

        $parsed = CarbonImmutable::parse($date)->toDateString();
        $minimumAllowedStart = $this->minimumAllowedStart($user);

        if ($minimumAllowedStart === null) {
            return $parsed;
        }

        if (CarbonImmutable::parse($parsed)->lt($minimumAllowedStart)) {
            return $minimumAllowedStart->toDateString();
        }

        return $parsed;
    }
}
