<?php

namespace App\Services\AnnualTrainingPlan;

use App\Enums\GoalPriority;
use App\Enums\TrainingSessionStatus;
use App\Models\AnnualTrainingPlan;
use App\Models\AnnualTrainingPlanWeek;
use App\Models\Goal;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AthleteAnnualTrainingPlanService
{
    private const CACHE_KEY_PREFIX = 'atp.payload.v2';

    /**
     * @return array{
     *     id: int,
     *     user_id: int,
     *     year: int,
     *     weeks: array<int, array{
     *         week_index: int,
     *         iso_week: int,
     *         week_start_date: string,
     *         week_end_date: string,
     *         week_type: string,
     *         priority: string,
     *         notes: string|null,
     *         planned_minutes: int,
     *         completed_minutes: int,
     *         planned_tss: int|null,
     *         completed_tss: int|null,
     *         primary_goal: array{
     *             id: int,
     *             title: string,
     *             target_date: string|null,
     *             priority: string,
     *             status: string
     *         }|null,
     *         weeks_to_goal: int|null
     *     }>
     * }
     */
    public function forYear(User $user, int $year): array
    {
        return Cache::remember(
            $this->cacheKey($user, $year),
            now()->addSeconds(60),
            fn (): array => $this->buildPayload($user, $year),
        );
    }

    /**
     * @param  array{week_type?: string, priority?: string, notes?: string|null}  $attributes
     * @return array{
     *     week_index: int,
     *     iso_week: int,
     *     week_start_date: string,
     *     week_end_date: string,
     *     week_type: string,
     *     priority: string,
     *     notes: string|null,
     *     planned_minutes: int,
     *     completed_minutes: int,
     *     planned_tss: int|null,
     *     completed_tss: int|null,
     *     primary_goal: array{
     *         id: int,
     *         title: string,
     *         target_date: string|null,
     *         priority: string,
     *         status: string
     *     }|null,
     *     weeks_to_goal: int|null
     * }
     */
    public function updateWeekMetadata(
        User $user,
        int $year,
        string $weekStartDate,
        array $attributes,
    ): array {
        $weekMap = $this->weeksForYear($year);

        if (! array_key_exists($weekStartDate, $weekMap)) {
            throw ValidationException::withMessages([
                'week_start' => 'The selected week is invalid for this ATP year.',
            ]);
        }

        $plan = $this->firstOrCreatePlan($user, $year);

        AnnualTrainingPlanWeek::query()->updateOrCreate(
            [
                'annual_training_plan_id' => $plan->id,
                'week_start_date' => $weekStartDate,
            ],
            [
                'week_type' => $attributes['week_type'] ?? $this->defaultWeekType(),
                'priority' => $attributes['priority'] ?? $this->defaultPriority(),
                'notes' => array_key_exists('notes', $attributes)
                    ? $attributes['notes']
                    : null,
            ],
        );

        Cache::forget($this->cacheKey($user, $year));

        /** @var array{
         *     id: int,
         *     user_id: int,
         *     year: int,
         *     weeks: array<int, array{
         *         week_start_date: string
         *     }>
         * } $payload
         */
        $payload = $this->forYear($user, $year);
        $week = collect($payload['weeks'])->first(
            fn (array $item): bool => $item['week_start_date'] === $weekStartDate,
        );

        if (! is_array($week)) {
            throw ValidationException::withMessages([
                'week_start' => 'The selected week could not be updated.',
            ]);
        }

        return $week;
    }

    /**
     * @return list<string>
     */
    public function weekTypes(): array
    {
        /** @var list<string> $types */
        $types = config('training.atp.week_types', [
            'base',
            'build',
            'recovery',
            'peak',
            'race',
            'transition',
        ]);

        return $types;
    }

    /**
     * @return list<string>
     */
    public function priorities(): array
    {
        /** @var list<string> $priorities */
        $priorities = config('training.atp.priorities', [
            'low',
            'normal',
            'high',
        ]);

        return $priorities;
    }

    private function defaultWeekType(): string
    {
        return $this->weekTypes()[0] ?? 'build';
    }

    private function defaultPriority(): string
    {
        return in_array('normal', $this->priorities(), true)
            ? 'normal'
            : ($this->priorities()[0] ?? 'normal');
    }

    /**
     * @return array{
     *     id: int,
     *     user_id: int,
     *     year: int,
     *     weeks: array<int, array{
     *         week_index: int,
     *         iso_week: int,
     *         week_start_date: string,
     *         week_end_date: string,
     *         week_type: string,
     *         priority: string,
     *         notes: string|null,
     *         planned_minutes: int,
     *         completed_minutes: int,
     *         planned_tss: int|null,
     *         completed_tss: int|null,
     *         primary_goal: array{
     *             id: int,
     *             title: string,
     *             target_date: string|null,
     *             priority: string,
     *             status: string
     *         }|null,
     *         weeks_to_goal: int|null
     *     }>
     * }
     */
    private function buildPayload(User $user, int $year): array
    {
        $plan = $this->firstOrCreatePlan($user, $year);
        $weekMap = $this->weeksForYear($year);
        $weekStarts = array_keys($weekMap);
        $weekDefinitions = array_values($weekMap);
        $firstWeekStart = $weekStarts[0] ?? CarbonImmutable::create($year, 1, 1)->toDateString();
        $lastWeekEnd = $weekDefinitions !== []
            ? ($weekDefinitions[count($weekDefinitions) - 1]['end'] ?? CarbonImmutable::create($year, 12, 31))
            : CarbonImmutable::create($year, 12, 31);

        $sessions = TrainingSession::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_date', '>=', $firstWeekStart)
            ->whereDate('scheduled_date', '<=', $lastWeekEnd->toDateString())
            ->get([
                'scheduled_date',
                'status',
                'duration_minutes',
                'actual_duration_minutes',
                'planned_tss',
                'actual_tss',
                'completed_at',
            ]);

        $metricsByWeek = $this->buildSessionMetrics($sessions);
        $goalMap = $this->buildGoalMap($user, $firstWeekStart, $lastWeekEnd->toDateString());
        $metadataMap = AnnualTrainingPlanWeek::query()
            ->where('annual_training_plan_id', $plan->id)
            ->whereDate('week_start_date', '>=', $firstWeekStart)
            ->whereDate('week_start_date', '<=', $lastWeekEnd->toDateString())
            ->get([
                'week_start_date',
                'week_type',
                'priority',
                'notes',
            ])
            ->keyBy(fn (AnnualTrainingPlanWeek $week): string => $week->week_start_date->toDateString());

        $weeks = [];

        foreach ($weekMap as $weekStart => $definition) {
            $metadata = $metadataMap->get($weekStart);
            $metrics = $metricsByWeek[$weekStart] ?? [
                'planned_minutes' => 0,
                'completed_minutes' => 0,
                'planned_tss' => 0,
                'completed_tss' => 0,
            ];
            $goal = $goalMap[$weekStart] ?? null;

            $weeks[] = [
                'week_index' => $definition['week_index'],
                'iso_week' => $definition['iso_week'],
                'week_start_date' => $weekStart,
                'week_end_date' => $definition['end']->toDateString(),
                'week_type' => $metadata?->week_type ?? $this->defaultWeekType(),
                'priority' => $metadata?->priority ?? $this->defaultPriority(),
                'notes' => $metadata?->notes,
                'planned_minutes' => $metrics['planned_minutes'],
                'completed_minutes' => $metrics['completed_minutes'],
                'planned_tss' => $metrics['planned_tss'] > 0
                    ? $metrics['planned_tss']
                    : null,
                'completed_tss' => $metrics['completed_tss'] > 0
                    ? $metrics['completed_tss']
                    : null,
                'primary_goal' => $goal,
                'weeks_to_goal' => $goal !== null
                    ? $this->weeksBetween($weekStart, $goal['target_date'])
                    : null,
            ];
        }

        return [
            'id' => $plan->id,
            'user_id' => $plan->user_id,
            'year' => $plan->year,
            'weeks' => $weeks,
        ];
    }

    private function firstOrCreatePlan(User $user, int $year): AnnualTrainingPlan
    {
        return AnnualTrainingPlan::query()->firstOrCreate([
            'user_id' => $user->id,
            'year' => $year,
        ]);
    }

    /**
     * @return array<string, array{
     *     week_index: int,
     *     iso_week: int,
     *     end: CarbonImmutable
     * }>
     */
    private function weeksForYear(int $year): array
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

        return $weeks;
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
    private function buildSessionMetrics(Collection $sessions): array
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
            $metricsByWeek[$weekStart]['planned_minutes'] += max(0, (int) $session->duration_minutes);
            $metricsByWeek[$weekStart]['planned_tss'] += max(0, (int) ($session->planned_tss ?? 0));

            $isCompleted = $session->completed_at !== null
                || $session->status === TrainingSessionStatus::Completed;

            if (! $isCompleted) {
                continue;
            }

            $metricsByWeek[$weekStart]['completed_minutes'] += max(
                0,
                (int) ($session->actual_duration_minutes ?? $session->duration_minutes),
            );
            $metricsByWeek[$weekStart]['completed_tss'] += max(0, (int) ($session->actual_tss ?? 0));
        }

        return $metricsByWeek;
    }

    /**
     * @return array<string, array{
     *     id: int,
     *     title: string,
     *     target_date: string|null,
     *     priority: string,
     *     status: string
     * }>
     */
    private function buildGoalMap(User $user, string $from, string $to): array
    {
        $goalsByWeek = [];

        /** @var Collection<int, Goal> $goals */
        $goals = Goal::query()
            ->where('user_id', $user->id)
            ->whereNotNull('target_date')
            ->whereDate('target_date', '>=', $from)
            ->whereDate('target_date', '<=', $to)
            ->orderBy('target_date')
            ->get([
                'id',
                'title',
                'target_date',
                'priority',
                'status',
            ]);

        foreach ($goals as $goal) {
            if ($goal->target_date === null) {
                continue;
            }

            $weekStart = CarbonImmutable::parse($goal->target_date->toDateString())
                ->startOfWeek(CarbonInterface::MONDAY)
                ->toDateString();

            $candidate = [
                'id' => $goal->id,
                'title' => $goal->title,
                'target_date' => $goal->target_date->toDateString(),
                'priority' => $goal->priority?->value ?? (string) $goal->priority,
                'status' => $goal->status?->value ?? (string) $goal->status,
            ];

            $current = $goalsByWeek[$weekStart] ?? null;

            if ($current === null) {
                $goalsByWeek[$weekStart] = $candidate;

                continue;
            }

            if (
                $this->priorityWeight($candidate['priority'])
                > $this->priorityWeight($current['priority'])
            ) {
                $goalsByWeek[$weekStart] = $candidate;
            }
        }

        return $goalsByWeek;
    }

    private function priorityWeight(string $priority): int
    {
        return match ($priority) {
            GoalPriority::High->value => 3,
            GoalPriority::Normal->value => 2,
            GoalPriority::Low->value => 1,
            default => 0,
        };
    }

    private function weeksBetween(string $weekStart, ?string $goalDate): ?int
    {
        if ($goalDate === null) {
            return null;
        }

        $from = CarbonImmutable::parse($weekStart)->startOfWeek(CarbonInterface::MONDAY);
        $to = CarbonImmutable::parse($goalDate)->startOfWeek(CarbonInterface::MONDAY);

        return (int) floor($from->diffInDays($to, false) / 7);
    }

    private function cacheKey(User $user, int $year): string
    {
        return sprintf('%s.user.%d.year.%d', self::CACHE_KEY_PREFIX, $user->id, $year);
    }
}
