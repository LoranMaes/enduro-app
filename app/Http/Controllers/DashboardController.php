<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Http\Resources\TrainingPlanResource;
use App\Http\Resources\TrainingSessionResource;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
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
        $calendarWindow = $this->resolveCalendarWindow($validated);

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
        $trainingSessionResource = TrainingSessionResource::collection(
            $this->querySessionsForUser($request->user())
                ->whereDate('scheduled_date', '>=', $calendarWindow['starts_at'])
                ->whereDate('scheduled_date', '<=', $calendarWindow['ends_at'])
                ->with('activity')
                ->orderBy('scheduled_date')
                ->orderBy('id')
                ->get(),
        );

        return Inertia::render('dashboard', [
            'trainingPlans' => $trainingPlanResource->response()->getData(true),
            'trainingSessions' => $trainingSessionResource->response()->getData(true),
            'calendarWindow' => $calendarWindow,
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

    /**
     * @param  array<string, mixed>  $validated
     * @return array{starts_at: string, ends_at: string}
     */
    private function resolveCalendarWindow(array $validated): array
    {
        $today = CarbonImmutable::today();
        $defaultStartsAt = $today->startOfWeek()->subWeeks(4)->toDateString();
        $defaultEndsAt = $today->endOfWeek()->addWeeks(4)->toDateString();

        return [
            'starts_at' => (string) ($validated['starts_from'] ?? $defaultStartsAt),
            'ends_at' => (string) ($validated['ends_to'] ?? $defaultEndsAt),
        ];
    }

    private function querySessionsForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingSession::query();
        }

        if ($user->isAthlete()) {
            return TrainingSession::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingSession::query()->whereIn(
                'user_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return TrainingSession::query()->whereRaw('1 = 0');
    }
}
