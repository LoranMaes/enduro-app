<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Support\QueryScopes\TrainingScope;
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

        $activities = TrainingScope::forVisibleActivities($request->user())
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
}
