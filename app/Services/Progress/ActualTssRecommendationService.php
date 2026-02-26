<?php

namespace App\Services\Progress;

use Carbon\CarbonImmutable;

class ActualTssRecommendationService
{
    /**
     * @param  array<string, int>  $actualTssByWeek
     * @param  array<int, string>  $weekStartsAt
     * @return array<string, array{
     *     min_tss: int|null,
     *     max_tss: int|null,
     *     state: 'low'|'in_range'|'high'|'insufficient',
     *     source: 'actual_tss_trailing_4w'
     * }>
     */
    public function resolve(array $actualTssByWeek, array $weekStartsAt): array
    {
        $recommendations = [];

        foreach ($weekStartsAt as $weekStart) {
            $history = $this->resolveHistory($actualTssByWeek, $weekStart);
            $actualTss = max(0, (int) ($actualTssByWeek[$weekStart] ?? 0));
            $band = $this->resolveBand($history);

            if ($band === null) {
                $recommendations[$weekStart] = [
                    'min_tss' => null,
                    'max_tss' => null,
                    'state' => 'insufficient',
                    'source' => 'actual_tss_trailing_4w',
                ];

                continue;
            }

            $recommendations[$weekStart] = [
                'min_tss' => $band['min_tss'],
                'max_tss' => $band['max_tss'],
                'state' => $this->classify($actualTss, $band['min_tss'], $band['max_tss']),
                'source' => 'actual_tss_trailing_4w',
            ];
        }

        return $recommendations;
    }

    /**
     * @param  array<string, int>  $actualTssByWeek
     * @return list<int>
     */
    private function resolveHistory(array $actualTssByWeek, string $weekStart): array
    {
        $history = [];
        $currentWeekStart = CarbonImmutable::parse($weekStart)->startOfWeek();

        for ($offset = 1; $offset <= 4; $offset++) {
            $historyWeekStart = $currentWeekStart
                ->subWeeks($offset)
                ->toDateString();
            $historyTss = max(0, (int) ($actualTssByWeek[$historyWeekStart] ?? 0));

            if ($historyTss === 0) {
                continue;
            }

            $history[] = $historyTss;
        }

        return $history;
    }

    /**
     * @param  list<int>  $history
     * @return array{min_tss: int, max_tss: int}|null
     */
    private function resolveBand(array $history): ?array
    {
        if (count($history) < 2) {
            return null;
        }

        $averageTss = array_sum($history) / count($history);
        $minTss = max(0, (int) round($averageTss * 0.85));
        $maxTss = max($minTss, (int) round($averageTss * 1.15));

        return [
            'min_tss' => $minTss,
            'max_tss' => $maxTss,
        ];
    }

    /**
     * @return 'low'|'in_range'|'high'
     */
    private function classify(int $actualTss, int $minTss, int $maxTss): string
    {
        if ($actualTss < $minTss) {
            return 'low';
        }

        if ($actualTss > $maxTss) {
            return 'high';
        }

        return 'in_range';
    }
}
