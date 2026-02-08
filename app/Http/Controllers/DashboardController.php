<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Http\Resources\TrainingPlanResource;
use App\Models\TrainingPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function __invoke(IndexRequest $request): Response|RedirectResponse
    {
        if ($request->user()->isAdmin()) {
            return redirect()->route('admin.index');
        }

        $this->authorize('viewAny', TrainingPlan::class);

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);

        $plans = $this->queryForUser($request->user())
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
                            $sessionQuery->orderBy('scheduled_date');
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
        ]);
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingPlan::query();
        }

        if ($user->isAthlete()) {
            return TrainingPlan::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingPlan::query()->whereIn(
                'user_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return TrainingPlan::query()->whereRaw('1 = 0');
    }
}
