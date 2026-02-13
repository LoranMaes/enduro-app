<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AnnualTrainingPlan\AthleteAnnualTrainingPlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AtpController extends Controller
{
    public function __construct(
        private readonly AthleteAnnualTrainingPlanService $athleteAnnualTrainingPlanService,
    ) {}

    public function __invoke(Request $request, int $year): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if ($year < 2000 || $year > 2100) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'The selected year is invalid.');
        }

        return response()->json([
            'data' => $this->athleteAnnualTrainingPlanService->forYear($user, $year),
        ]);
    }
}
