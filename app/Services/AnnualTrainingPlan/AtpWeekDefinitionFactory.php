<?php

namespace App\Services\AnnualTrainingPlan;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class AtpWeekDefinitionFactory
{
    /**
     * @return array{
     *     weeks: array<string, array{
     *         week_index: int,
     *         iso_week: int,
     *         end: CarbonImmutable
     *     }>,
     *     first_week_start: string,
     *     last_week_end: CarbonImmutable
     * }
     */
    public function forYear(int $year): array
    {
        $yearStart = CarbonImmutable::create($year, 1, 1, 0, 0, 0);
        $yearEnd = CarbonImmutable::create($year, 12, 31, 0, 0, 0);
        $cursor = $yearStart->startOfWeek(CarbonInterface::MONDAY);
        $weeks = [];
        $index = 1;

        while ($cursor->lessThanOrEqualTo($yearEnd)) {
            $weeks[$cursor->toDateString()] = [
                'week_index' => $index,
                'iso_week' => (int) $cursor->isoWeek(),
                'end' => $cursor->endOfWeek(CarbonInterface::SUNDAY),
            ];

            $cursor = $cursor->addWeek();
            $index++;
        }

        $weekStarts = array_keys($weeks);
        $firstWeekStart = $weekStarts[0] ?? $yearStart->toDateString();
        $lastWeekEnd = $weeks !== []
            ? ($weeks[$weekStarts[array_key_last($weekStarts)]]['end'] ?? $yearEnd)
            : $yearEnd;

        return [
            'weeks' => $weeks,
            'first_week_start' => $firstWeekStart,
            'last_week_end' => $lastWeekEnd,
        ];
    }
}
