<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AnnualTrainingPlan\AthleteAnnualTrainingPlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AtpPageController extends Controller
{
    public function __construct(
        private readonly AthleteAnnualTrainingPlanService $athleteAnnualTrainingPlanService,
    ) {}

    public function __invoke(Request $request, int $year): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        if ($year < 2000 || $year > 2100) {
            abort(HttpResponse::HTTP_UNPROCESSABLE_ENTITY, 'The selected year is invalid.');
        }

        return Inertia::render('atp/index', [
            'year' => $year,
            'plan' => $this->athleteAnnualTrainingPlanService->forYear($user, $year),
            'weekTypeOptions' => $this->athleteAnnualTrainingPlanService->weekTypes(),
            'priorityOptions' => $this->athleteAnnualTrainingPlanService->priorities(),
        ]);
    }
}
