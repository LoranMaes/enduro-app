<?php

namespace App\Services\Progress;

use App\Enums\TrainingSessionPlanningSource;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;

class ComplianceService
{
    public function __construct(
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

        $plannedSessionsByWeek = [];
        $plannedCompletedByWeek = [];
        $plannedDurationByWeek = [];
        $completedDurationByWeek = [];
        $actualMinutesByWeek = [];

        foreach ($historyWeekStartsAt as $weekStartsAt) {
            $plannedSessionsByWeek[$weekStartsAt] = 0;
            $plannedCompletedByWeek[$weekStartsAt] = 0;
            $plannedDurationByWeek[$weekStartsAt] = 0;
            $completedDurationByWeek[$weekStartsAt] = 0;
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
                'planning_source',
                'completed_at',
                'duration_minutes',
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

            $isPlannedSession = (
                ($session->planning_source instanceof TrainingSessionPlanningSource
                    ? $session->planning_source
                    : TrainingSessionPlanningSource::tryFrom((string) $session->planning_source))
                ?? TrainingSessionPlanningSource::Planned
            ) === TrainingSessionPlanningSource::Planned;
            $isCompleted = $session->completed_at !== null;
            $actualDurationMinutes = max(0, (int) ($session->actual_duration_minutes ?? 0));

            if ($isCompleted) {
                $actualMinutesByWeek[$weekStartsAt] += $actualDurationMinutes;
            }

            if (! $isPlannedSession) {
                continue;
            }

            $plannedSessionsByWeek[$weekStartsAt]++;
            $plannedDurationByWeek[$weekStartsAt] += max(0, (int) $session->duration_minutes);

            if (! $isCompleted) {
                continue;
            }

            $plannedCompletedByWeek[$weekStartsAt]++;
            $completedDurationByWeek[$weekStartsAt] += $actualDurationMinutes;
        }

        $bands = $this->weeklyRecommendationBandService->resolve(
            $actualMinutesByWeek,
            $rangeWeekStartsAt,
        );

        $weeks = [];
        $totalPlannedSessions = 0;
        $totalPlannedCompleted = 0;

        foreach ($rangeWeekStartsAt as $weekStartsAt) {
            $plannedSessionsCount = $plannedSessionsByWeek[$weekStartsAt] ?? 0;
            $plannedCompletedCount = $plannedCompletedByWeek[$weekStartsAt] ?? 0;
            $complianceRatio = $plannedSessionsCount > 0
                ? $plannedCompletedCount / $plannedSessionsCount
                : 0.0;

            $weeks[] = [
                'week_starts_at' => $weekStartsAt,
                'week_ends_at' => CarbonImmutable::parse($weekStartsAt)
                    ->addDays(6)
                    ->toDateString(),
                'planned_sessions_count' => $plannedSessionsCount,
                'planned_completed_count' => $plannedCompletedCount,
                'compliance_ratio' => $complianceRatio,
                'planned_duration_minutes_total' => $plannedDurationByWeek[$weekStartsAt] ?? 0,
                'completed_duration_minutes_total' => $completedDurationByWeek[$weekStartsAt] ?? 0,
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
