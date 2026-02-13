<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateAtpWeekRequest;
use App\Models\User;
use App\Services\AnnualTrainingPlan\AthleteAnnualTrainingPlanService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AtpWeekController extends Controller
{
    public function __construct(
        private readonly AthleteAnnualTrainingPlanService $athleteAnnualTrainingPlanService,
    ) {}

    public function __invoke(
        UpdateAtpWeekRequest $request,
        int $year,
        string $weekStart,
    ): JsonResponse {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if ($year < 2000 || $year > 2100) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'The selected year is invalid.');
        }

        try {
            $normalizedWeekStart = CarbonImmutable::parse($weekStart)->toDateString();
        } catch (Throwable) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'The selected week is invalid.');
        }

        return response()->json([
            'data' => $this->athleteAnnualTrainingPlanService->updateWeekMetadata(
                $user,
                $year,
                $normalizedWeekStart,
                $request->validated(),
            ),
        ]);
    }
}
