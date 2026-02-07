<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListTrainingSessionRequest;
use App\Http\Resources\TrainingSessionResource;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TrainingSessionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @todo Implement training session listing with policy-aware query scoping.
     */
    public function index(ListTrainingSessionRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TrainingSession::class);
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);

        $sessions = $this->queryForUser($request->user())
            ->when(
                isset($validated['from']),
                fn (Builder $query) => $query->whereDate('scheduled_date', '>=', $validated['from']),
            )
            ->when(
                isset($validated['to']),
                fn (Builder $query) => $query->whereDate('scheduled_date', '<=', $validated['to']),
            )
            ->when(
                isset($validated['training_plan_id']),
                fn (Builder $query) => $query->whereHas('trainingWeek', function (Builder $weekQuery) use ($validated): void {
                    $weekQuery->where('training_plan_id', $validated['training_plan_id']);
                }),
            )
            ->when(
                isset($validated['training_week_id']),
                fn (Builder $query) => $query->where('training_week_id', $validated['training_week_id']),
            )
            ->orderBy('scheduled_date')
            ->paginate($perPage)
            ->withQueryString();

        return TrainingSessionResource::collection($sessions);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @todo Implement training session creation workflow and validation.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@store.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training session retrieval.
     */
    public function show(TrainingSession $trainingSession): TrainingSessionResource
    {
        $this->authorize('view', $trainingSession);

        return new TrainingSessionResource($trainingSession);
    }

    /**
     * Update the specified resource in storage.
     *
     * @todo Implement training session update workflow and validation.
     */
    public function update(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@update.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @todo Implement training session deletion workflow.
     */
    public function destroy(TrainingSession $trainingSession): JsonResponse
    {
        return response()->json([
            'message' => 'TODO: implement TrainingSessionController@destroy.',
        ], Response::HTTP_NOT_IMPLEMENTED);
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingSession::query();
        }

        if ($user->isAthlete()) {
            return TrainingSession::query()->whereHas('trainingWeek.trainingPlan', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id);
            });
        }

        /** @todo Add coach-athlete assignment query scoping. */
        return TrainingSession::query()->whereRaw('1 = 0');
    }
}
