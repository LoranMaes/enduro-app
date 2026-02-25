<?php

namespace App\Services\Metrics;

use App\Models\AthleteWeekMetric;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;

class WeeklyMetricsSnapshotService
{
    private const CACHE_KEY_PREFIX = 'athlete-week-metrics.v1';

    private const CACHE_VERSION_KEY_PREFIX = 'athlete-week-metrics.version.v1';

    public function __construct(
        private readonly WeeklyMetricsCalculator $weeklyMetricsCalculator,
    ) {}

    public function recalculateForUser(User $user, Carbon $from, Carbon $to): void
    {
        $rangeStart = CarbonImmutable::parse($from)->startOfDay();
        $rangeEnd = CarbonImmutable::parse($to)->startOfDay();

        if ($rangeStart->greaterThan($rangeEnd)) {
            return;
        }

        $weeklyMetrics = $this->weeklyMetricsCalculator->calculate(
            $user,
            $rangeStart,
            $rangeEnd,
        );
        $timestamp = now();
        $upserts = array_values(array_map(
            static fn (array $week): array => [
                ...$week,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            $weeklyMetrics,
        ));

        foreach (array_chunk($upserts, 150) as $batch) {
            AthleteWeekMetric::query()->upsert(
                $batch,
                ['user_id', 'week_start_date'],
                [
                    'week_end_date',
                    'planned_sessions_count',
                    'planned_completed_count',
                    'planned_minutes_total',
                    'completed_minutes_total',
                    'planned_tss_total',
                    'completed_tss_total',
                    'load_state',
                    'load_state_ratio',
                    'load_state_source',
                    'updated_at',
                ],
            );
        }

        $this->bumpCacheVersion($user);
    }

    /**
     * @return array<string, array{
     *     week_start_date: string,
     *     week_end_date: string,
     *     planned_sessions_count: int,
     *     planned_completed_count: int,
     *     planned_minutes_total: int,
     *     completed_minutes_total: int,
     *     planned_tss_total: int,
     *     completed_tss_total: int,
     *     load_state: string,
     *     load_state_ratio: float|null,
     *     load_state_source: string
     * }>
     */
    public function resolveRange(
        User $user,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $rangeStart = $from->startOfDay()->startOfWeek(CarbonInterface::MONDAY);
        $rangeEnd = $to->startOfDay()->endOfWeek(CarbonInterface::SUNDAY);
        $cacheVersion = $this->cacheVersion($user);
        $cacheKey = $this->cacheKey(
            $user,
            $rangeStart->toDateString(),
            $rangeEnd->toDateString(),
            $cacheVersion,
        );

        /** @var array<string, array{
         *     week_start_date: string,
         *     week_end_date: string,
         *     planned_sessions_count: int,
         *     planned_completed_count: int,
         *     planned_minutes_total: int,
         *     completed_minutes_total: int,
         *     planned_tss_total: int,
         *     completed_tss_total: int,
         *     load_state: string,
         *     load_state_ratio: float|null,
         *     load_state_source: string
         * }> $metrics
         */
        $metrics = Cache::remember(
            $cacheKey,
            now()->addSeconds(60),
            function () use ($user, $rangeStart, $rangeEnd): array {
                $persistedWeeks = AthleteWeekMetric::query()
                    ->where('user_id', $user->id)
                    ->whereDate('week_start_date', '>=', $rangeStart->toDateString())
                    ->whereDate('week_start_date', '<=', $rangeEnd->toDateString())
                    ->orderBy('week_start_date')
                    ->get([
                        'week_start_date',
                        'week_end_date',
                        'planned_sessions_count',
                        'planned_completed_count',
                        'planned_minutes_total',
                        'completed_minutes_total',
                        'planned_tss_total',
                        'completed_tss_total',
                        'load_state',
                        'load_state_ratio',
                        'load_state_source',
                    ])
                    ->keyBy(fn (AthleteWeekMetric $week): string => $week->week_start_date->toDateString());
                $expectedCount = $this->weekCountBetween($rangeStart, $rangeEnd);

                if ($persistedWeeks->count() < $expectedCount) {
                    $this->recalculateForUser(
                        $user,
                        Carbon::parse($rangeStart),
                        Carbon::parse($rangeEnd),
                    );
                    $persistedWeeks = AthleteWeekMetric::query()
                        ->where('user_id', $user->id)
                        ->whereDate('week_start_date', '>=', $rangeStart->toDateString())
                        ->whereDate('week_start_date', '<=', $rangeEnd->toDateString())
                        ->orderBy('week_start_date')
                        ->get([
                            'week_start_date',
                            'week_end_date',
                            'planned_sessions_count',
                            'planned_completed_count',
                            'planned_minutes_total',
                            'completed_minutes_total',
                            'planned_tss_total',
                            'completed_tss_total',
                            'load_state',
                            'load_state_ratio',
                            'load_state_source',
                        ])
                        ->keyBy(fn (AthleteWeekMetric $week): string => $week->week_start_date->toDateString());
                }

                $results = [];
                $cursor = $rangeStart;

                while ($cursor->lessThanOrEqualTo($rangeEnd)) {
                    $weekKey = $cursor->toDateString();
                    /** @var AthleteWeekMetric|null $metric */
                    $metric = $persistedWeeks->get($weekKey);

                    $results[$weekKey] = [
                        'week_start_date' => $weekKey,
                        'week_end_date' => $cursor->endOfWeek(CarbonInterface::SUNDAY)->toDateString(),
                        'planned_sessions_count' => (int) ($metric?->planned_sessions_count ?? 0),
                        'planned_completed_count' => (int) ($metric?->planned_completed_count ?? 0),
                        'planned_minutes_total' => (int) ($metric?->planned_minutes_total ?? 0),
                        'completed_minutes_total' => (int) ($metric?->completed_minutes_total ?? 0),
                        'planned_tss_total' => (int) ($metric?->planned_tss_total ?? 0),
                        'completed_tss_total' => (int) ($metric?->completed_tss_total ?? 0),
                        'load_state' => $metric?->load_state?->value ?? 'insufficient',
                        'load_state_ratio' => $metric?->load_state_ratio !== null
                            ? (float) $metric->load_state_ratio
                            : null,
                        'load_state_source' => $metric?->load_state_source ?? 'planned_completed_tss_ratio',
                    ];
                    $cursor = $cursor->addWeek();
                }

                return $results;
            },
        );

        return $metrics;
    }

    private function cacheKey(
        User $user,
        string $from,
        string $to,
        int $version,
    ): string {
        return sprintf(
            '%s.user.%d.from.%s.to.%s.v.%d',
            self::CACHE_KEY_PREFIX,
            $user->id,
            $from,
            $to,
            $version,
        );
    }

    private function cacheVersion(User $user): int
    {
        return (int) Cache::get($this->cacheVersionKey($user), 1);
    }

    private function bumpCacheVersion(User $user): void
    {
        Cache::forever(
            $this->cacheVersionKey($user),
            $this->cacheVersion($user) + 1,
        );
    }

    private function cacheVersionKey(User $user): string
    {
        return sprintf(
            '%s.user.%d',
            self::CACHE_VERSION_KEY_PREFIX,
            $user->id,
        );
    }

    private function weekCountBetween(CarbonImmutable $from, CarbonImmutable $to): int
    {
        $count = 0;
        $cursor = $from->startOfWeek(CarbonInterface::MONDAY);
        $rangeEnd = $to->startOfWeek(CarbonInterface::MONDAY);

        while ($cursor->lessThanOrEqualTo($rangeEnd)) {
            $count++;
            $cursor = $cursor->addWeek();
        }

        return $count;
    }
}
