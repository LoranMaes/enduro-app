<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListWorkoutLibraryItemRequest;
use App\Http\Requests\Api\StoreWorkoutLibraryItemRequest;
use App\Http\Requests\Api\UpdateWorkoutLibraryItemRequest;
use App\Http\Resources\WorkoutLibraryItemResource;
use App\Models\User;
use App\Models\WorkoutLibraryItem;
use App\Services\WorkoutLibrary\WorkoutLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class WorkoutLibraryController extends Controller
{
    public function __construct(
        private readonly WorkoutLibraryService $workoutLibraryService,
    ) {}

    public function index(
        ListWorkoutLibraryItemRequest $request,
    ): AnonymousResourceCollection {
        $this->authorize('viewAny', WorkoutLibraryItem::class);
        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $items = $this->workoutLibraryService->listForUser(
            $user,
            $request->validated(),
        );

        return WorkoutLibraryItemResource::collection($items);
    }

    public function store(
        StoreWorkoutLibraryItemRequest $request,
    ): JsonResponse {
        $this->authorize('create', WorkoutLibraryItem::class);
        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $item = $this->workoutLibraryService->createForUser(
            $user,
            $request->validated(),
        );

        return (new WorkoutLibraryItemResource($item))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateWorkoutLibraryItemRequest $request,
        WorkoutLibraryItem $workoutLibrary,
    ): WorkoutLibraryItemResource {
        $this->authorize('update', $workoutLibrary);

        $item = $this->workoutLibraryService->updateItem(
            $workoutLibrary,
            $request->validated(),
        );

        return new WorkoutLibraryItemResource($item);
    }

    public function destroy(WorkoutLibraryItem $workoutLibrary): \Illuminate\Http\Response
    {
        $this->authorize('delete', $workoutLibrary);
        $this->workoutLibraryService->deleteItem($workoutLibrary);

        return response()->noContent();
    }
}
