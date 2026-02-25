<?php

namespace App\Services\Progress;

use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Metrics\WeeklyMetricsSnapshotService;
use Carbon\CarbonImmutable;

class ComplianceService
{
    public function __construct(
        private readonly WeeklyMetricsSnapshotService $weeklyMetricsSnapshotService,
        private readonly WeeklyRecommendationBandService $weeklyRecommendationBandService,
    ) {}

    /**
     * @return array{
     *     weeks: array<int, array{
     *         week_starts_at: string,
     *         week_ends_at: string,
     *         planned_sessions_count: int,
     *         planned_completed_count: int,
     *         compliance_ratio: float,
     *         planned_duration_minutes_total: int,
     *         completed_duration_minutes_total: int,
     *         planned_tss_total: int,
     *         completed_tss_total: int,
     *         load_state: string,
     *         load_state_ratio: float|null,
     *         load_state_source: string,
     *         actual_minutes_total: int,
     *         recommendation_band: array{min_minutes: int, max_minutes: int}|null
     *     }>,
     *     summary: array{
     *         total_planned_sessions_count: int,
     *         total_planned_completed_count: int,
     *         compliance_ratio: float,
     *         range_starts_at: string,
     *         range_ends_at: string
     *     }
     * }
     */
    public function resolve(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rangeStartsAt = $from->startOfDay()->startOfWeek();
        $rangeEndsAt = $to->startOfDay()->endOfWeek();
        $historyStartsAt = $rangeStartsAt->subWeeks(4);
        $rangeWeekStartsAt = $this->weekStartsBetween($rangeStartsAt, $rangeEndsAt);
        $historyWeekStartsAt = $this->weekStartsBetween($historyStartsAt, $rangeEndsAt);
        $snapshotMetrics = $this->weeklyMetricsSnapshotService->resolveRange(
            $user,
            $rangeStartsAt,
            $rangeEndsAt,
        );

        $actualMinutesByWeek = [];

        foreach ($historyWeekStartsAt as $weekStartsAt) {
            $actualMinutesByWeek[$weekStartsAt] = 0;
        }

        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $historyStartsAt->toDateString())
            ->whereDate('scheduled_date', '<=', $rangeEndsAt->toDateString())
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'scheduled_date',
                'completed_at',
                'actual_duration_minutes',
            ]);

        foreach ($sessions as $session) {
            if ($session->scheduled_date === null) {
                continue;
            }

            $weekStartsAt = CarbonImmutable::parse(
                $session->scheduled_date->toDateString(),
            )
                ->startOfWeek()
                ->toDateString();

            if (! array_key_exists($weekStartsAt, $actualMinutesByWeek)) {
                continue;
            }

            if ($session->completed_at === null) {
                continue;
            }

            $actualMinutesByWeek[$weekStartsAt] += max(
                0,
                (int) ($session->actual_duration_minutes ?? 0),
            );
        }

        $bands = $this->weeklyRecommendationBandService->resolve(
            $actualMinutesByWeek,
            $rangeWeekStartsAt,
        );

        $weeks = [];
        $totalPlannedSessions = 0;
        $totalPlannedCompleted = 0;

        foreach ($rangeWeekStartsAt as $weekStartsAt) {
            $snapshot = $snapshotMetrics[$weekStartsAt] ?? [
                'week_start_date' => $weekStartsAt,
                'week_end_date' => CarbonImmutable::parse($weekStartsAt)
                    ->addDays(6)
                    ->toDateString(),
                'planned_sessions_count' => 0,
                'planned_completed_count' => 0,
                'planned_minutes_total' => 0,
                'completed_minutes_total' => 0,
                'planned_tss_total' => 0,
                'completed_tss_total' => 0,
                'load_state' => 'insufficient',
                'load_state_ratio' => null,
                'load_state_source' => 'planned_completed_tss_ratio',
            ];
            $plannedSessionsCount = (int) $snapshot['planned_sessions_count'];
            $plannedCompletedCount = (int) $snapshot['planned_completed_count'];
            $complianceRatio = $plannedSessionsCount > 0
                ? $plannedCompletedCount / $plannedSessionsCount
                : 0.0;

            $weeks[] = [
                'week_starts_at' => $weekStartsAt,
                'week_ends_at' => (string) $snapshot['week_end_date'],
                'planned_sessions_count' => $plannedSessionsCount,
                'planned_completed_count' => $plannedCompletedCount,
                'compliance_ratio' => $complianceRatio,
                'planned_duration_minutes_total' => (int) $snapshot['planned_minutes_total'],
                'completed_duration_minutes_total' => (int) $snapshot['completed_minutes_total'],
                'planned_tss_total' => (int) $snapshot['planned_tss_total'],
                'completed_tss_total' => (int) $snapshot['completed_tss_total'],
                'load_state' => (string) $snapshot['load_state'],
                'load_state_ratio' => $snapshot['load_state_ratio'] !== null
                    ? (float) $snapshot['load_state_ratio']
                    : null,
                'load_state_source' => (string) $snapshot['load_state_source'],
                'actual_minutes_total' => $actualMinutesByWeek[$weekStartsAt] ?? 0,
                'recommendation_band' => $bands[$weekStartsAt] ?? null,
            ];

            $totalPlannedSessions += $plannedSessionsCount;
            $totalPlannedCompleted += $plannedCompletedCount;
        }

        return [
            'weeks' => $weeks,
            'summary' => [
                'total_planned_sessions_count' => $totalPlannedSessions,
                'total_planned_completed_count' => $totalPlannedCompleted,
                'compliance_ratio' => $totalPlannedSessions > 0
                    ? $totalPlannedCompleted / $totalPlannedSessions
                    : 0.0,
                'range_starts_at' => $rangeStartsAt->toDateString(),
                'range_ends_at' => $rangeEndsAt->toDateString(),
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function weekStartsBetween(
        CarbonImmutable $startsAt,
        CarbonImmutable $endsAt,
    ): array {
        $weekStartsAt = [];
        $cursor = $startsAt->startOfWeek();
        $finalWeek = $endsAt->startOfWeek();

        while ($cursor->lessThanOrEqualTo($finalWeek)) {
            $weekStartsAt[] = $cursor->toDateString();
            $cursor = $cursor->addWeek();
        }

        return $weekStartsAt;
    }
}
