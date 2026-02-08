<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Http\Resources\TrainingPlanResource;
use App\Models\TrainingPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class AthleteCalendarController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(IndexRequest $request, User $athlete): Response
    {
        abort_unless($athlete->isAthlete(), 404);

        $viewer = $request->user();

        if (! $this->canViewAthleteCalendar($viewer, $athlete)) {
            abort(403);
        }

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);

        $plans = TrainingPlan::query()
            ->where('user_id', $athlete->id)
            ->when(
                isset($validated['starts_from']),
                fn (Builder $query) => $query->whereDate('ends_at', '>=', $validated['starts_from']),
            )
            ->when(
                isset($validated['ends_to']),
                fn (Builder $query) => $query->whereDate('starts_at', '<=', $validated['ends_to']),
            )
            ->with([
                'trainingWeeks' => function ($query): void {
                    $query->orderBy('starts_at')->with([
                        'trainingSessions' => function ($sessionQuery): void {
                            $sessionQuery
                                ->orderBy('scheduled_date')
                                ->with('activity');
                        },
                    ]);
                },
            ])
            ->orderByDesc('starts_at')
            ->paginate($perPage)
            ->withQueryString();

        $trainingPlanResource = TrainingPlanResource::collection($plans);

        return Inertia::render('dashboard', [
            'trainingPlans' => $trainingPlanResource->response()->getData(true),
            'viewingAthlete' => [
                'id' => $athlete->id,
                'name' => $athlete->name,
            ],
        ]);
    }

    private function canViewAthleteCalendar(User $viewer, User $athlete): bool
    {
        if ($viewer->isAdmin()) {
            return true;
        }

        if ($viewer->isAthlete()) {
            return $viewer->is($athlete);
        }

        if ($viewer->isCoach()) {
            return $viewer->coachedAthletes()->whereKey($athlete->id)->exists();
        }

        return false;
    }
}
