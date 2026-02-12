<?php

namespace App\Http\Controllers;

use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Http\Requests\Progress\IndexRequest;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class AthleteProgressController extends Controller
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
    ) {}

    public function __invoke(IndexRequest $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAthlete(), 403);

        $rangeOptions = [4, 8, 12, 24];
        $selectedWeeks = (int) ($request->validated()['weeks'] ?? 12);
        $selectedWeeks = in_array($selectedWeeks, $rangeOptions, true)
            ? $selectedWeeks
            : 12;

        $currentWeekStart = CarbonImmutable::today()->startOfWeek();
        $windowStart = $currentWeekStart->subWeeks($selectedWeeks - 1);
        $windowEnd = $currentWeekStart->addDays(6);

        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $windowStart->toDateString())
            ->whereDate('scheduled_date', '<=', $windowEnd->toDateString())
            ->with([
                'activity:id,training_session_id,duration_seconds,raw_payload',
            ])
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'scheduled_date',
                'status',
                'planning_source',
                'duration_minutes',
                'actual_duration_minutes',
                'planned_tss',
                'actual_tss',
            ]);
        $sessionIdsInWindow = array_fill_keys(
            $sessions
                ->pluck('id')
                ->filter(static fn (mixed $id): bool => is_int($id) || is_string($id))
                ->map(static fn (mixed $id): int => (int) $id)
                ->all(),
            true,
        );
        $activities = Activity::query()
            ->where('athlete_id', $user->id)
            ->whereDate('started_at', '>=', $windowStart->toDateString())
            ->whereDate('started_at', '<=', $windowEnd->toDateString())
            ->orderBy('started_at')
            ->orderBy('id')
            ->get([
                'id',
                'training_session_id',
                'started_at',
                'duration_seconds',
                'raw_payload',
            ]);

        $weeklyBuckets = [];

        for ($weekIndex = 0; $weekIndex < $selectedWeeks; $weekIndex++) {
            $weekStart = $windowStart->addWeeks($weekIndex);
            $key = $weekStart->toDateString();

            $weeklyBuckets[$key] = [
                'week_start' => $key,
                'week_end' => $weekStart->addDays(6)->toDateString(),
                'planned_duration_minutes' => 0,
                'actual_duration_minutes' => 0,
                'planned_tss' => 0,
                'actual_tss' => 0,
                'planned_sessions' => 0,
                'completed_sessions' => 0,
            ];
        }

        foreach ($sessions as $session) {
            if ($session->scheduled_date === null) {
                continue;
            }

            $weekKey = CarbonImmutable::parse(
                $session->scheduled_date->toDateString(),
            )->startOfWeek()->toDateString();

            if (! array_key_exists($weekKey, $weeklyBuckets)) {
                continue;
            }

            $isPlannedSession = (
                ($session->planning_source instanceof TrainingSessionPlanningSource
                    ? $session->planning_source
                    : TrainingSessionPlanningSource::tryFrom((string) $session->planning_source))
                ?? TrainingSessionPlanningSource::Planned
            ) === TrainingSessionPlanningSource::Planned;

            if ($isPlannedSession) {
                $weeklyBuckets[$weekKey]['planned_sessions']++;
                $weeklyBuckets[$weekKey]['planned_duration_minutes'] += $session->duration_minutes;
                $weeklyBuckets[$weekKey]['planned_tss'] += $session->planned_tss ?? 0;
            }

            $actualDurationMinutes = $this->actualMetricsResolver->resolveActualDurationMinutes($session);
            $actualTss = $this->actualMetricsResolver->resolveActualTss($session, $user);
            $isSessionCompleted = (
                ($session->status instanceof TrainingSessionStatus
                    ? $session->status
                    : TrainingSessionStatus::tryFrom((string) $session->status))
                === TrainingSessionStatus::Completed
            );
            $hasActualExecution = $isSessionCompleted
                || $session->activity !== null
                || $actualDurationMinutes !== null
                || $actualTss !== null;

            if ($hasActualExecution) {
                if ($isPlannedSession) {
                    $weeklyBuckets[$weekKey]['completed_sessions']++;
                }
                $weeklyBuckets[$weekKey]['actual_duration_minutes'] += $actualDurationMinutes
                    ?? $session->duration_minutes;
                $weeklyBuckets[$weekKey]['actual_tss'] += $actualTss
                    ?? $session->planned_tss
                    ?? 0;
            }
        }

        foreach ($activities as $activity) {
            if ($activity->started_at === null) {
                continue;
            }

            if (
                $activity->training_session_id !== null
                && array_key_exists(
                    (int) $activity->training_session_id,
                    $sessionIdsInWindow,
                )
            ) {
                continue;
            }

            $weekKey = CarbonImmutable::parse(
                $activity->started_at->toDateString(),
            )->startOfWeek()->toDateString();

            if (! array_key_exists($weekKey, $weeklyBuckets)) {
                continue;
            }

            $resolvedActivityDuration = $this->actualMetricsResolver->resolveActivityDurationMinutes($activity);
            $resolvedActivityTss = $this->actualMetricsResolver->resolveActivityTss($activity, $user);

            if ($resolvedActivityDuration === null && $resolvedActivityTss === null) {
                continue;
            }

            $weeklyBuckets[$weekKey]['actual_duration_minutes'] += $resolvedActivityDuration ?? 0;
            $weeklyBuckets[$weekKey]['actual_tss'] += $resolvedActivityTss ?? 0;
        }

        $progressWeeks = array_map(
            function (array $bucket): array {
                $hasPlannedSessions = $bucket['planned_sessions'] > 0;
                $hasActualLoad = $bucket['completed_sessions'] > 0
                    || $bucket['actual_duration_minutes'] > 0
                    || $bucket['actual_tss'] > 0;

                return [
                    'week_start' => $bucket['week_start'],
                    'week_end' => $bucket['week_end'],
                    'planned_duration_minutes' => $hasPlannedSessions
                        ? $bucket['planned_duration_minutes']
                        : null,
                    'actual_duration_minutes' => $hasActualLoad
                        ? $bucket['actual_duration_minutes']
                        : null,
                    'planned_tss' => $hasPlannedSessions
                        ? $bucket['planned_tss']
                        : null,
                    'actual_tss' => $hasActualLoad
                        ? $bucket['actual_tss']
                        : null,
                    'planned_sessions' => $bucket['planned_sessions'],
                    'completed_sessions' => $bucket['completed_sessions'],
                ];
            },
            array_values($weeklyBuckets),
        );

        $totalPlannedDuration = 0;
        $totalActualDuration = 0;
        $totalPlannedTss = 0;
        $totalActualTss = 0;
        $totalPlannedSessions = 0;
        $totalCompletedSessions = 0;
        $consistencyWeeks = 0;
        $currentStreakWeeks = 0;

        foreach ($progressWeeks as $week) {
            $plannedSessions = (int) $week['planned_sessions'];
            $completedSessions = (int) $week['completed_sessions'];
            $plannedDuration = $week['planned_duration_minutes'] ?? 0;
            $actualDuration = $week['actual_duration_minutes'] ?? 0;
            $plannedTss = $week['planned_tss'] ?? 0;
            $actualTss = $week['actual_tss'] ?? 0;

            $totalPlannedSessions += $plannedSessions;
            $totalCompletedSessions += $completedSessions;
            $totalPlannedDuration += $plannedDuration;
            $totalActualDuration += $actualDuration;
            $totalPlannedTss += $plannedTss;
            $totalActualTss += $actualTss;

            if ($plannedSessions > 0 && $completedSessions >= $plannedSessions) {
                $consistencyWeeks++;
            }
        }

        for ($index = count($progressWeeks) - 1; $index >= 0; $index--) {
            $week = $progressWeeks[$index];
            $plannedSessions = (int) $week['planned_sessions'];
            $completedSessions = (int) $week['completed_sessions'];

            if ($plannedSessions === 0) {
                continue;
            }

            if ($completedSessions >= $plannedSessions) {
                $currentStreakWeeks++;

                continue;
            }

            break;
        }

        return Inertia::render('progress/index', [
            'range' => [
                'weeks' => $selectedWeeks,
                'options' => $rangeOptions,
            ],
            'summary' => [
                'average_weekly_tss' => $selectedWeeks > 0
                    ? (int) round($totalActualTss / $selectedWeeks)
                    : null,
                'average_weekly_duration_minutes' => $selectedWeeks > 0
                    ? (int) round($totalActualDuration / $selectedWeeks)
                    : null,
                'planned_tss_total' => $totalPlannedTss,
                'actual_tss_total' => $totalActualTss,
                'planned_duration_minutes_total' => $totalPlannedDuration,
                'actual_duration_minutes_total' => $totalActualDuration,
                'planned_sessions_total' => $totalPlannedSessions,
                'completed_sessions_total' => $totalCompletedSessions,
                'consistency_weeks' => $consistencyWeeks,
                'current_streak_weeks' => $currentStreakWeeks,
            ],
            'weeks' => $progressWeeks,
        ]);
    }
}
