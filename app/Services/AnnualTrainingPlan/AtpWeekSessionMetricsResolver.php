<?php

namespace App\Services\AnnualTrainingPlan;

use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class AtpWeekSessionMetricsResolver
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
    ) {}

    /**
     * @return array<string, array{
     *     planned_minutes: int,
     *     completed_minutes: int,
     *     planned_tss: int,
     *     completed_tss: int
     * }>
     */
    public function resolve(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $from->toDateString())
            ->whereDate('scheduled_date', '<=', $to->toDateString())
            ->with([
                'activity:id,training_session_id,athlete_id,provider,raw_payload,duration_seconds',
            ])
            ->get([
                'id',
                'scheduled_date',
                'status',
                'planning_source',
                'duration_minutes',
                'actual_duration_minutes',
                'planned_tss',
                'actual_tss',
                'completed_at',
            ]);

        return $this->buildSessionMetrics($sessions, $user);
    }

    /**
     * @param  Collection<int, TrainingSession>  $sessions
     * @return array<string, array{
     *     planned_minutes: int,
     *     completed_minutes: int,
     *     planned_tss: int,
     *     completed_tss: int
     * }>
     */
    private function buildSessionMetrics(Collection $sessions, User $user): array
    {
        $metricsByWeek = [];

        foreach ($sessions as $session) {
            if ($session->scheduled_date === null) {
                continue;
            }

            $weekStart = CarbonImmutable::parse($session->scheduled_date->toDateString())
                ->startOfWeek(CarbonInterface::MONDAY)
                ->toDateString();

            $metricsByWeek[$weekStart] ??= [
                'planned_minutes' => 0,
                'completed_minutes' => 0,
                'planned_tss' => 0,
                'completed_tss' => 0,
            ];

            $planningSource = $session->planning_source instanceof TrainingSessionPlanningSource
                ? $session->planning_source
                : TrainingSessionPlanningSource::tryFrom((string) $session->planning_source);

            if ($planningSource === TrainingSessionPlanningSource::Planned) {
                $metricsByWeek[$weekStart]['planned_minutes'] += max(0, (int) $session->duration_minutes);
                $metricsByWeek[$weekStart]['planned_tss'] += max(0, (int) ($session->planned_tss ?? 0));
            }

            $status = $session->status instanceof TrainingSessionStatus
                ? $session->status
                : TrainingSessionStatus::tryFrom((string) $session->status);
            $isCompleted = $session->completed_at !== null
                || $status === TrainingSessionStatus::Completed;

            if (! $isCompleted) {
                continue;
            }

            $metricsByWeek[$weekStart]['completed_minutes'] += max(
                0,
                (int) ($session->actual_duration_minutes ?? $session->duration_minutes),
            );
            $resolvedCompletedTss = $this->actualMetricsResolver->resolveActualTss(
                $session,
                $user,
            );
            $metricsByWeek[$weekStart]['completed_tss'] += max(
                0,
                (int) ($resolvedCompletedTss ?? 0),
            );
        }

        return $metricsByWeek;
    }
}
