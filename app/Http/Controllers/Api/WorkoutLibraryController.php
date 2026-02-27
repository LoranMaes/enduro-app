<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListWorkoutLibraryItemRequest;
use App\Http\Requests\Api\StoreWorkoutLibraryItemRequest;
use App\Http\Requests\Api\UpdateWorkoutLibraryItemRequest;
use App\Http\Resources\WorkoutLibraryItemResource;
use App\Models\User;
use App\Models\WorkoutLibraryItem;
use App\Services\Entitlements\SubscriptionFeatureMatrixService;
use App\Services\WorkoutLibrary\WorkoutLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Laravel\Pennant\Feature;
use Symfony\Component\HttpFoundation\Response;

class WorkoutLibraryController extends Controller
{
    public function __construct(
        private readonly WorkoutLibraryService $workoutLibraryService,
        private readonly SubscriptionFeatureMatrixService $subscriptionFeatureMatrixService,
    ) {}

    public function index(
        ListWorkoutLibraryItemRequest $request,
    ): AnonymousResourceCollection {
        $this->authorize('viewAny', WorkoutLibraryItem::class);
        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        abort_unless(Feature::for($user)->active('workout.library'), Response::HTTP_FORBIDDEN);

        $items = $this->workoutLibraryService->listForUser(
            $user,
            $request->validated(),
        );

        return WorkoutLibraryItemResource::collection($items)->additional([
            'meta' => [
                'total_count' => $this->workoutLibraryService->countForUser($user),
            ],
        ]);
    }

    public function store(
        StoreWorkoutLibraryItemRequest $request,
    ): JsonResponse {
        $this->authorize('create', WorkoutLibraryItem::class);
        $user = $request->user();

        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        abort_unless(Feature::for($user)->active('workout.library'), Response::HTTP_FORBIDDEN);
        $limit = $this->subscriptionFeatureMatrixService->limitFor(
            $user,
            'workout.library',
        );

        if ($limit !== null) {
            $currentCount = WorkoutLibraryItem::query()
                ->where('user_id', $user->id)
                ->count();

            if ($currentCount >= $limit) {
                throw ValidationException::withMessages([
                    'workout_library' => "Free athletes can store up to {$limit} workout templates in total.",
                ]);
            }
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
        $user = $request->user();
        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);
        abort_unless(Feature::for($user)->active('workout.library'), Response::HTTP_FORBIDDEN);

        $item = $this->workoutLibraryService->updateItem(
            $workoutLibrary,
            $request->validated(),
        );

        return new WorkoutLibraryItemResource($item);
    }

    public function destroy(
        Request $request,
        WorkoutLibraryItem $workoutLibrary,
    ): \Illuminate\Http\Response {
        $this->authorize('delete', $workoutLibrary);
        $user = $request->user();
        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);
        abort_unless(Feature::for($user)->active('workout.library'), Response::HTTP_FORBIDDEN);
        $this->workoutLibraryService->deleteItem($workoutLibrary);

        return response()->noContent();
    }
}
