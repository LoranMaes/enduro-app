<?php

namespace App\Services\AnnualTrainingPlan;

use App\Models\AnnualTrainingPlan;
use App\Models\AnnualTrainingPlanWeek;
use App\Models\User;
use App\Services\Metrics\WeeklyMetricsSnapshotService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AthleteAnnualTrainingPlanService
{
    private const CACHE_KEY_PREFIX = 'atp.payload.v2';

    public function __construct(
        private readonly AtpWeekDefinitionFactory $atpWeekDefinitionFactory,
        private readonly AtpWeekSessionMetricsResolver $atpWeekSessionMetricsResolver,
        private readonly AtpWeekGoalResolver $atpWeekGoalResolver,
        private readonly WeeklyMetricsSnapshotService $weeklyMetricsSnapshotService,
    ) {}

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
     *         load_state: string,
     *         load_state_ratio: float|null,
     *         is_current_week: bool,
     *         primary_goal: array{
     *             id: int,
     *             title: string,
     *             target_date: string|null,
     *             priority: string,
     *             status: string
     *         }|null,
     *         goal_marker: array{
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
     *     load_state: string,
     *     load_state_ratio: float|null,
     *     is_current_week: bool,
     *     primary_goal: array{
     *         id: int,
     *         title: string,
     *         target_date: string|null,
     *         priority: string,
     *         status: string
     *     }|null,
     *     goal_marker: array{
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
        $weekMap = $this->atpWeekDefinitionFactory->forYear($year)['weeks'];

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

        /** @var array{id: int, user_id: int, year: int, weeks: array<int, array{week_start_date: string}>} $payload */
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
     *         load_state: string,
     *         load_state_ratio: float|null,
     *         is_current_week: bool,
     *         primary_goal: array{
     *             id: int,
     *             title: string,
     *             target_date: string|null,
     *             priority: string,
     *             status: string
     *         }|null,
     *         goal_marker: array{
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
        $weekDefinition = $this->atpWeekDefinitionFactory->forYear($year);
        $weekMap = $weekDefinition['weeks'];
        $firstWeekStart = $weekDefinition['first_week_start'];
        $lastWeekEnd = $weekDefinition['last_week_end'];
        $firstWeekStartDate = CarbonImmutable::parse($firstWeekStart);

        $metricsByWeek = $this->atpWeekSessionMetricsResolver->resolve(
            $user,
            $firstWeekStartDate,
            $lastWeekEnd,
        );
        $snapshotMetricsByWeek = $this->weeklyMetricsSnapshotService->resolveRange(
            $user,
            $firstWeekStartDate,
            $lastWeekEnd,
        );
        $goalMap = $this->atpWeekGoalResolver->resolve(
            $user,
            $firstWeekStartDate,
            $lastWeekEnd,
        );
        $metadataMap = AnnualTrainingPlanWeek::query()
            ->where('annual_training_plan_id', $plan->id)
            ->whereDate('week_start_date', '>=', $firstWeekStartDate->toDateString())
            ->whereDate('week_start_date', '<=', $lastWeekEnd->toDateString())
            ->get([
                'week_start_date',
                'week_type',
                'priority',
                'notes',
            ])
            ->keyBy(fn (AnnualTrainingPlanWeek $week): string => $week->week_start_date->toDateString());

        $weeks = [];
        $currentWeekStart = CarbonImmutable::now()
            ->startOfWeek(CarbonInterface::MONDAY)
            ->toDateString();

        foreach ($weekMap as $weekStart => $definition) {
            $metadata = $metadataMap->get($weekStart);
            $metrics = $metricsByWeek[$weekStart] ?? [
                'planned_minutes' => 0,
                'completed_minutes' => 0,
                'planned_tss' => 0,
                'completed_tss' => 0,
            ];
            $goal = $goalMap[$weekStart] ?? null;
            $snapshot = $snapshotMetricsByWeek[$weekStart] ?? null;

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
                'load_state' => (string) ($snapshot['load_state'] ?? 'insufficient'),
                'load_state_ratio' => $snapshot !== null && $snapshot['load_state_ratio'] !== null
                    ? (float) $snapshot['load_state_ratio']
                    : null,
                'is_current_week' => $weekStart === $currentWeekStart,
                'primary_goal' => $goal,
                'goal_marker' => $goal,
                'weeks_to_goal' => $goal !== null
                    ? $this->atpWeekGoalResolver->weeksToGoal($weekStart, $goal['target_date'])
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

    private function cacheKey(User $user, int $year): string
    {
        return sprintf('%s.user.%d.year.%d', self::CACHE_KEY_PREFIX, $user->id, $year);
    }
}
