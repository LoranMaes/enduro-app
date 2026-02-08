<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities.
     */
    public function index(ListActivityRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Activity::class);

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);

        $activities = $this->queryForUser($request->user())
            ->when(
                isset($validated['provider']),
                fn (Builder $query) => $query->where('provider', $validated['provider']),
            )
            ->when(
                isset($validated['from']),
                fn (Builder $query) => $query->whereDate('started_at', '>=', $validated['from']),
            )
            ->when(
                isset($validated['to']),
                fn (Builder $query) => $query->whereDate('started_at', '<=', $validated['to']),
            )
            ->orderByDesc('started_at')
            ->paginate($perPage)
            ->withQueryString();

        return ActivityResource::collection($activities);
    }

    /**
     * Display the specified activity.
     */
    public function show(Activity $activity): ActivityResource
    {
        $this->authorize('view', $activity);
        $activity->loadMissing('trainingSession');

        return new ActivityResource($activity);
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return Activity::query();
        }

        if ($user->isAthlete()) {
            return Activity::query()->where('athlete_id', $user->id);
        }

        if ($user->isCoach()) {
            return Activity::query()->whereIn(
                'athlete_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return Activity::query()->whereRaw('1 = 0');
    }
}
