<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListTrainingWeekRequest;
use App\Http\Requests\Api\StoreTrainingWeekRequest;
use App\Http\Requests\Api\UpdateTrainingWeekRequest;
use App\Http\Resources\TrainingWeekResource;
use App\Models\TrainingPlan;
use App\Models\TrainingWeek;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\JsonResponse as SymfonyJsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TrainingWeekController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement training week listing with policy-aware query scoping.
     */
    public function index(ListTrainingWeekRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TrainingWeek::class);
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);

        $weeks = $this->queryForUser($request->user())
            ->when(
                isset($validated['starts_from']),
                fn (Builder $query) => $query->whereDate('starts_at', '>=', $validated['starts_from']),
            )
            ->when(
                isset($validated['ends_to']),
                fn (Builder $query) => $query->whereDate('starts_at', '<=', $validated['ends_to']),
            )
            ->with([
                'trainingSessions' => function ($query): void {
                    $query
                        ->orderBy('scheduled_date')
                        ->with('activity');
                },
            ])
            ->orderByDesc('starts_at')
            ->paginate($perPage)
            ->withQueryString();

        return TrainingWeekResource::collection($weeks);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @todo Implement training week creation workflow and validation.
     */
    public function store(StoreTrainingWeekRequest $request): SymfonyJsonResponse
    {
        $this->authorize('create', TrainingWeek::class);

        $validated = $request->validated();

        $trainingPlan = TrainingPlan::query()->findOrFail(
            (int) $validated['training_plan_id'],
        );
        $this->authorize('update', $trainingPlan);

        $trainingWeek = TrainingWeek::query()->create([
            'training_plan_id' => $trainingPlan->id,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
        ]);

        $trainingWeek->load('trainingSessions.activity');

        return (new TrainingWeekResource($trainingWeek))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training week retrieval.
     */
    public function show(TrainingWeek $trainingWeek): TrainingWeekResource
    {
        $this->authorize('view', $trainingWeek);

        $trainingWeek->load([
            'trainingSessions' => function ($query): void {
                $query
                    ->orderBy('scheduled_date')
                    ->with('activity');
            },
        ]);

        return new TrainingWeekResource($trainingWeek);
    }

    /**
     * Update the specified resource in storage.
     *
     * @todo Implement training week update workflow and validation.
     */
    public function update(UpdateTrainingWeekRequest $request, TrainingWeek $trainingWeek): TrainingWeekResource
    {
        $this->authorize('update', $trainingWeek);

        $trainingWeek->update($request->validated());
        $trainingWeek->load('trainingSessions.activity');

        return new TrainingWeekResource($trainingWeek);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement training week deletion workflow.
     */
    public function destroy(TrainingWeek $trainingWeek): JsonResponse
    {
        $this->authorize('delete', $trainingWeek);

        $resource = new TrainingWeekResource($trainingWeek);
        $trainingWeek->delete();

        return $resource->response();
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingWeek::query();
        }

        if ($user->isAthlete()) {
            return TrainingWeek::query()->whereHas('trainingPlan', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id);
            });
        }

        if ($user->isCoach()) {
            return TrainingWeek::query()->whereHas('trainingPlan', function (Builder $query) use ($user): void {
                $query->whereIn(
                    'user_id',
                    $user->coachedAthletes()->select('users.id'),
                );
            });
        }

        return TrainingWeek::query()->whereRaw('1 = 0');
    }
}
