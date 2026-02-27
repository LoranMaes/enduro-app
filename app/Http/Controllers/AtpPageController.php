<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AnnualTrainingPlan\AthleteAnnualTrainingPlanService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Pennant\Feature;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AtpPageController extends Controller
{
    public function __construct(
        private readonly AthleteAnnualTrainingPlanService $athleteAnnualTrainingPlanService,
    ) {}

    public function __invoke(Request $request, int $year): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        if ($year < 2000 || $year > 2100) {
            abort(HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 'The selected year is invalid.');
        }

        $hasAtpAccess = Feature::for($user)->active('atp.read');

        return Inertia::render('atp/index', [
            'year' => $year,
            'isLocked' => ! $hasAtpAccess,
            'plan' => $hasAtpAccess
                ? $this->athleteAnnualTrainingPlanService->forYear($user, $year)
                : $this->buildLockedPreviewPlan($user, $year),
            'weekTypeOptions' => $this->athleteAnnualTrainingPlanService->weekTypes(),
            'priorityOptions' => $this->athleteAnnualTrainingPlanService->priorities(),
        ]);
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
     *         load_state: 'low'|'in_range'|'high'|'insufficient',
     *         load_state_ratio: float|null,
     *         recommended_tss_state: 'low'|'in_range'|'high'|'insufficient',
     *         recommended_tss_source: 'actual_tss_trailing_4w',
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
    private function buildLockedPreviewPlan(User $user, int $year): array
    {
        $weekTypes = $this->athleteAnnualTrainingPlanService->weekTypes();
        $priorities = $this->athleteAnnualTrainingPlanService->priorities();

        if ($weekTypes === []) {
            $weekTypes = ['base'];
        }

        if ($priorities === []) {
            $priorities = ['normal'];
        }

        $periodStart = CarbonImmutable::create($year, 1, 1)
            ->startOfWeek(CarbonInterface::MONDAY);
        $periodEnd = CarbonImmutable::create($year, 12, 31)
            ->endOfWeek(CarbonInterface::SUNDAY);
        $currentWeekStart = CarbonImmutable::now()
            ->startOfWeek(CarbonInterface::MONDAY)
            ->toDateString();

        $weeks = [];
        $weekIndex = 0;
        $cursor = $periodStart;

        while ($cursor->lessThanOrEqualTo($periodEnd)) {
            $plannedMinutes = 260 + (($weekIndex * 37) % 180);
            $completedMinutes = max(120, $plannedMinutes + ((($weekIndex % 5) - 2) * 28));
            $plannedTss = (int) round($plannedMinutes * 0.9);
            $completedTss = (int) round($completedMinutes * 0.92);
            $ratio = $plannedTss > 0 ? $completedTss / $plannedTss : null;
            $loadState = $this->resolveLoadState($ratio);
            $goalMarker = $weekIndex > 0 && $weekIndex % 13 === 0
                ? [
                    'id' => 700000 + $weekIndex,
                    'title' => 'Preview Goal '.((int) floor($weekIndex / 13) + 1),
                    'target_date' => $cursor->addDays(5)->toDateString(),
                    'priority' => $priorities[$weekIndex % count($priorities)] ?? 'normal',
                    'status' => 'active',
                ]
                : null;

            $weeks[] = [
                'week_index' => $weekIndex + 1,
                'iso_week' => $cursor->isoWeek(),
                'week_start_date' => $cursor->toDateString(),
                'week_end_date' => $cursor->endOfWeek(CarbonInterface::SUNDAY)->toDateString(),
                'week_type' => $weekTypes[$weekIndex % count($weekTypes)] ?? 'base',
                'priority' => $priorities[$weekIndex % count($priorities)] ?? 'normal',
                'notes' => null,
                'planned_minutes' => $plannedMinutes,
                'completed_minutes' => $completedMinutes,
                'planned_tss' => $plannedTss,
                'completed_tss' => $completedTss,
                'load_state' => $loadState,
                'load_state_ratio' => $ratio,
                'recommended_tss_state' => $loadState,
                'recommended_tss_source' => 'actual_tss_trailing_4w',
                'is_current_week' => $cursor->toDateString() === $currentWeekStart,
                'primary_goal' => $goalMarker,
                'goal_marker' => $goalMarker,
                'weeks_to_goal' => $goalMarker !== null ? 0 : null,
            ];

            $weekIndex++;
            $cursor = $cursor->addWeek();
        }

        return [
            'id' => 0,
            'user_id' => (int) $user->getKey(),
            'year' => $year,
            'weeks' => $weeks,
        ];
    }

    private function resolveLoadState(?float $ratio): string
    {
        if ($ratio === null) {
            return 'insufficient';
        }

        if ($ratio < 0.85) {
            return 'low';
        }

        if ($ratio > 1.15) {
            return 'high';
        }

        return 'in_range';
    }
}
