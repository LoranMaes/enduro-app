<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListGoalRequest;
use App\Http\Requests\Api\StoreGoalRequest;
use App\Http\Requests\Api\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Goal;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class GoalController extends Controller
{
    public function index(ListGoalRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Goal::class);

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 100);
        $user = $request->user();
        $ownerId = $this->resolveOwnerIdForIndex($user, $validated);

        $goals = Goal::query()
            ->where('user_id', $ownerId)
            ->when(
                isset($validated['from']),
                fn (Builder $query) => $query->whereDate('target_date', '>=', $validated['from']),
            )
            ->when(
                isset($validated['to']),
                fn (Builder $query) => $query->whereDate('target_date', '<=', $validated['to']),
            )
            ->orderByRaw('target_date is null')
            ->orderBy('target_date')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return GoalResource::collection($goals);
    }

    public function store(StoreGoalRequest $request): JsonResponse
    {
        $this->authorize('create', Goal::class);

        $validated = $request->validated();
        $user = $request->user();
        $ownerId = $this->resolveOwnerIdForWrite($user, $validated);

        $goal = Goal::query()->create([
            'user_id' => $ownerId,
            'type' => $validated['type'],
            'sport' => $validated['sport'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'target_date' => $validated['target_date'] ?? null,
            'priority' => $validated['priority'] ?? 'normal',
            'status' => $validated['status'] ?? 'active',
        ]);

        return (new GoalResource($goal))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Goal $goal): GoalResource
    {
        $this->authorize('view', $goal);

        return new GoalResource($goal);
    }

    public function update(UpdateGoalRequest $request, Goal $goal): GoalResource
    {
        $this->authorize('update', $goal);

        $validated = $request->validated();

        $goal->update([
            'type' => $validated['type'] ?? $goal->type?->value ?? $goal->type,
            'sport' => array_key_exists('sport', $validated)
                ? $validated['sport']
                : $goal->sport?->value ?? $goal->sport,
            'title' => $validated['title'] ?? $goal->title,
            'description' => array_key_exists('description', $validated)
                ? $validated['description']
                : $goal->description,
            'target_date' => array_key_exists('target_date', $validated)
                ? $validated['target_date']
                : $goal->target_date?->toDateString(),
            'priority' => array_key_exists('priority', $validated)
                ? $validated['priority']
                : $goal->priority?->value ?? $goal->priority,
            'status' => $validated['status'] ?? $goal->status?->value ?? $goal->status,
        ]);

        return new GoalResource($goal->refresh());
    }

    public function destroy(Goal $goal): \Illuminate\Http\Response
    {
        $this->authorize('delete', $goal);

        $goal->delete();

        return response()->noContent();
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveOwnerIdForIndex(?User $user, array $validated): int
    {
        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        if ($user instanceof User && $user->isAdmin() && isset($validated['user_id'])) {
            return (int) $validated['user_id'];
        }

        return (int) $user->id;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveOwnerIdForWrite(?User $user, array $validated): int
    {
        if (! $user instanceof User) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        if ($user instanceof User && $user->isAdmin() && isset($validated['user_id'])) {
            $goalOwner = User::query()->find((int) $validated['user_id']);

            if (! $goalOwner instanceof User || ! $goalOwner->isAthlete()) {
                throw ValidationException::withMessages([
                    'user_id' => 'Goals can only be created for athlete accounts.',
                ]);
            }

            return $goalOwner->id;
        }

        if (! $user->isAthlete()) {
            throw ValidationException::withMessages([
                'user_id' => 'Select an athlete for this goal.',
            ]);
        }

        return (int) $user->id;
    }
}
