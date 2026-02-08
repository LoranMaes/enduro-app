<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListTrainingPlanRequest;
use App\Http\Requests\Api\StoreTrainingPlanRequest;
use App\Http\Requests\Api\UpdateTrainingPlanRequest;
use App\Http\Resources\TrainingPlanResource;
use App\Models\TrainingPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TrainingPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement training plan listing with policy-aware query scoping.
     */
    public function index(ListTrainingPlanRequest $request): AnonymousResourceCollection
    {
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

        return TrainingPlanResource::collection($plans);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTrainingPlanRequest $request): JsonResponse
    {
        $this->authorize('create', TrainingPlan::class);

        $validated = $request->validated();
        $user = $request->user();

        $ownerId = $user->isAdmin()
            ? (int) ($validated['user_id'] ?? $user->id)
            : $user->id;

        $trainingPlan = TrainingPlan::query()->create([
            'user_id' => $ownerId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
        ]);

        $trainingPlan->load('trainingWeeks.trainingSessions');

        return (new TrainingPlanResource($trainingPlan))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training plan retrieval.
     */
    public function show(TrainingPlan $trainingPlan): TrainingPlanResource
    {
        $this->authorize('view', $trainingPlan);

        $trainingPlan->load([
            'trainingWeeks' => function ($query): void {
                $query->orderBy('starts_at')->with([
                    'trainingSessions' => function ($sessionQuery): void {
                        $sessionQuery->orderBy('scheduled_date');
                    },
                ]);
            },
        ]);

        return new TrainingPlanResource($trainingPlan);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTrainingPlanRequest $request, TrainingPlan $trainingPlan): TrainingPlanResource
    {
        $this->authorize('update', $trainingPlan);

        $trainingPlan->update($request->validated());
        $trainingPlan->load('trainingWeeks.trainingSessions');

        return new TrainingPlanResource($trainingPlan);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement training plan deletion workflow.
     */
    public function destroy(TrainingPlan $trainingPlan): \Illuminate\Http\Response
    {
        $this->authorize('delete', $trainingPlan);

        $trainingPlan->delete();

        return response()->noContent();
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
