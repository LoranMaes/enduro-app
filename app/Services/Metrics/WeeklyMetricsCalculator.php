<?php

namespace App\Services\Metrics;

use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class WeeklyMetricsCalculator
{
    public function __construct(
        private readonly WeeklyLoadStateClassifier $weeklyLoadStateClassifier,
    ) {}

    /**
     * @return array<string, array{
     *     user_id: int,
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
    public function calculate(
        User $user,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $rangeStart = $from->startOfDay()->startOfWeek(CarbonInterface::MONDAY);
        $rangeEnd = $to->startOfDay()->endOfWeek(CarbonInterface::SUNDAY);

        $weeks = $this->seedWeeks($rangeStart, $rangeEnd, $user->id);

        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $rangeStart->toDateString())
            ->whereDate('scheduled_date', '<=', $rangeEnd->toDateString())
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'scheduled_date',
                'status',
                'planning_source',
                'duration_minutes',
                'actual_duration_minutes',
                'planned_tss',
                'actual_tss',
                'completed_at',
            ]);

        foreach ($sessions as $session) {
            if ($session->scheduled_date === null) {
                continue;
            }

            $weekStart = CarbonImmutable::parse($session->scheduled_date->toDateString())
                ->startOfWeek(CarbonInterface::MONDAY)
                ->toDateString();

            if (! array_key_exists($weekStart, $weeks)) {
                continue;
            }

            $planningSource = $session->planning_source instanceof TrainingSessionPlanningSource
                ? $session->planning_source
                : TrainingSessionPlanningSource::tryFrom((string) $session->planning_source);
            $isPlannedSession = $planningSource === TrainingSessionPlanningSource::Planned;

            $status = $session->status instanceof TrainingSessionStatus
                ? $session->status
                : TrainingSessionStatus::tryFrom((string) $session->status);
            $isCompleted = $session->completed_at !== null
                || $status === TrainingSessionStatus::Completed;

            if ($isPlannedSession) {
                $weeks[$weekStart]['planned_sessions_count']++;
                $weeks[$weekStart]['planned_minutes_total'] += max(0, (int) $session->duration_minutes);
                $weeks[$weekStart]['planned_tss_total'] += max(0, (int) ($session->planned_tss ?? 0));
            }

            if (! $isCompleted) {
                continue;
            }

            if ($isPlannedSession) {
                $weeks[$weekStart]['planned_completed_count']++;
            }

            $weeks[$weekStart]['completed_minutes_total'] += max(
                0,
                (int) ($session->actual_duration_minutes ?? $session->duration_minutes),
            );
            $weeks[$weekStart]['completed_tss_total'] += max(
                0,
                (int) ($session->actual_tss ?? $session->planned_tss ?? 0),
            );
        }

        foreach ($weeks as $weekStart => $week) {
            $classification = $this->weeklyLoadStateClassifier->classify(
                $week['planned_tss_total'],
                $week['completed_tss_total'],
            );

            $weeks[$weekStart] = [
                ...$week,
                ...$classification,
            ];
        }

        return $weeks;
    }

    /**
     * @return array<string, array{
     *     user_id: int,
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
    private function seedWeeks(
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        int $userId,
    ): array {
        $weeks = [];
        $cursor = $rangeStart;

        while ($cursor->lessThanOrEqualTo($rangeEnd)) {
            $weekStart = $cursor->toDateString();
            $weeks[$weekStart] = [
                'user_id' => $userId,
                'week_start_date' => $weekStart,
                'week_end_date' => $cursor->endOfWeek(CarbonInterface::SUNDAY)->toDateString(),
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
            $cursor = $cursor->addWeek();
        }

        return $weeks;
    }
}
