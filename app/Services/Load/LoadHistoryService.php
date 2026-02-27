<?php

namespace App\Services\Load;

use App\Models\TrainingLoadSnapshot;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class LoadHistoryService
{
    /**
     * @var array<int, string>
     */
    private const SPORT_BUCKETS = [
        'combined',
        'run',
        'bike',
        'swim',
        'other',
    ];

    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     combined: array<int, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>,
     *     per_sport: array{
     *         run: array<int, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>,
     *         bike: array<int, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>,
     *         swim: array<int, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>,
     *         other: array<int, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>
     *     },
     *     latest: array{
     *         date: string,
     *         atl: float,
     *         ctl: float,
     *         tsb: float
     *     }|null
     * }
     */
    public function resolve(
        User $user,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $rangeStart = $from->startOfDay();
        $rangeEnd = $to->startOfDay();

        if ($rangeStart->greaterThan($rangeEnd)) {
            $rangeStart = $rangeEnd;
        }

        $snapshots = TrainingLoadSnapshot::query()
            ->where('user_id', $user->id)
            ->whereDate('date', '>=', $rangeStart->toDateString())
            ->whereDate('date', '<=', $rangeEnd->toDateString())
            ->whereIn('sport', self::SPORT_BUCKETS)
            ->orderBy('date')
            ->orderBy('sport')
            ->get([
                'date',
                'sport',
                'tss',
                'atl',
                'ctl',
                'tsb',
            ]);

        $bySport = $this->seedSeriesBuckets($rangeStart, $rangeEnd);

        foreach ($snapshots as $snapshot) {
            $sport = (string) $snapshot->sport;

            if (! array_key_exists($sport, $bySport)) {
                continue;
            }

            $dateKey = $snapshot->date?->toDateString();

            if ($dateKey === null || ! array_key_exists($dateKey, $bySport[$sport])) {
                continue;
            }

            $bySport[$sport][$dateKey] = [
                'date' => $dateKey,
                'sport' => $sport,
                'tss' => (float) $snapshot->tss,
                'atl' => (float) $snapshot->atl,
                'ctl' => (float) $snapshot->ctl,
                'tsb' => (float) $snapshot->tsb,
            ];
        }

        $combinedSeries = array_values($bySport['combined']);
        $latestCombined = end($combinedSeries);

        return [
            'from' => $rangeStart->toDateString(),
            'to' => $rangeEnd->toDateString(),
            'combined' => $combinedSeries,
            'per_sport' => [
                'run' => array_values($bySport['run']),
                'bike' => array_values($bySport['bike']),
                'swim' => array_values($bySport['swim']),
                'other' => array_values($bySport['other']),
            ],
            'latest' => is_array($latestCombined)
                ? [
                    'date' => (string) $latestCombined['date'],
                    'atl' => (float) $latestCombined['atl'],
                    'ctl' => (float) $latestCombined['ctl'],
                    'tsb' => (float) $latestCombined['tsb'],
                ]
                : null,
        ];
    }

    /**
     * @return array<string, array<string, array{date: string, sport: string, tss: float, atl: float, ctl: float, tsb: float}>>
     */
    private function seedSeriesBuckets(
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $series = [];

        foreach (self::SPORT_BUCKETS as $sport) {
            $series[$sport] = [];
        }

        /** @var Collection<int, string> $dates */
        $dates = collect();
        $cursor = $from;

        while ($cursor->lessThanOrEqualTo($to)) {
            $dates->push($cursor->toDateString());
            $cursor = $cursor->addDay();
        }

        foreach ($dates as $date) {
            foreach (self::SPORT_BUCKETS as $sport) {
                $series[$sport][$date] = [
                    'date' => $date,
                    'sport' => $sport,
                    'tss' => 0.0,
                    'atl' => 0.0,
                    'ctl' => 0.0,
                    'tsb' => 0.0,
                ];
            }
        }

        return $series;
    }
}
