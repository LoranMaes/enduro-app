<?php

namespace App\Http\Controllers;

use App\Enums\TrainingSessionStatus;
use App\Http\Requests\Progress\IndexRequest;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class AthleteProgressController extends Controller
{
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
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'scheduled_date',
                'status',
                'duration_minutes',
                'actual_duration_minutes',
                'planned_tss',
                'actual_tss',
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

            $weeklyBuckets[$weekKey]['planned_sessions']++;
            $weeklyBuckets[$weekKey]['planned_duration_minutes'] += $session->duration_minutes;
            $weeklyBuckets[$weekKey]['planned_tss'] += $session->planned_tss ?? 0;

            if (
                ($session->status instanceof TrainingSessionStatus
                    ? $session->status
                    : TrainingSessionStatus::tryFrom((string) $session->status))
                === TrainingSessionStatus::Completed
            ) {
                $weeklyBuckets[$weekKey]['completed_sessions']++;
                $weeklyBuckets[$weekKey]['actual_duration_minutes'] += $session->actual_duration_minutes
                    ?? $session->duration_minutes;
                $weeklyBuckets[$weekKey]['actual_tss'] += $session->actual_tss
                    ?? $session->planned_tss
                    ?? 0;
            }
        }

        $progressWeeks = array_map(
            function (array $bucket): array {
                $hasPlannedSessions = $bucket['planned_sessions'] > 0;
                $hasCompletedSessions = $bucket['completed_sessions'] > 0;

                return [
                    'week_start' => $bucket['week_start'],
                    'week_end' => $bucket['week_end'],
                    'planned_duration_minutes' => $hasPlannedSessions
                        ? $bucket['planned_duration_minutes']
                        : null,
                    'actual_duration_minutes' => $hasCompletedSessions
                        ? $bucket['actual_duration_minutes']
                        : null,
                    'planned_tss' => $hasPlannedSessions
                        ? $bucket['planned_tss']
                        : null,
                    'actual_tss' => $hasCompletedSessions
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
