<?php

namespace App\Services\Progress;

use Carbon\CarbonImmutable;

class WeeklyRecommendationBandService
{
    /**
     * @param  array<string, int>  $actualMinutesByWeek
     * @param  array<int, string>  $weekStartsAt
     * @return array<string, array{min_minutes: int, max_minutes: int}|null>
     */
    public function resolve(array $actualMinutesByWeek, array $weekStartsAt): array
    {
        $bands = [];

        foreach ($weekStartsAt as $weekStartsAtDate) {
            $history = [];
            $weekStart = CarbonImmutable::parse($weekStartsAtDate)->startOfWeek();

            for ($offset = 1; $offset <= 4; $offset++) {
                $historyWeekKey = $weekStart->subWeeks($offset)->toDateString();
                $minutes = $actualMinutesByWeek[$historyWeekKey] ?? null;

                if (! is_int($minutes) || $minutes <= 0) {
                    continue;
                }

                $history[] = $minutes;
            }

            if (count($history) < 2) {
                $bands[$weekStartsAtDate] = null;

                continue;
            }

            $averageMinutes = array_sum($history) / count($history);
            $minMinutes = max(0, (int) round($averageMinutes * 0.85));
            $maxMinutes = max($minMinutes, (int) round($averageMinutes * 1.15));

            $bands[$weekStartsAtDate] = [
                'min_minutes' => $minMinutes,
                'max_minutes' => $maxMinutes,
            ];
        }

        return $bands;
    }
}
