<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\User;
use App\Services\Calendar\HistoryWindowLimiter;
use App\Support\QueryScopes\TrainingScope;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    public function __construct(
        private readonly HistoryWindowLimiter $historyWindowLimiter,
    ) {}

    /**
     * Display a listing of activities.
     */
    public function index(ListActivityRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Activity::class);

        $validated = $request->validated();
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $from = $this->historyWindowLimiter->clampDate(
            $user,
            isset($validated['from']) ? (string) $validated['from'] : null,
        );
        $to = isset($validated['to'])
            ? CarbonImmutable::parse((string) $validated['to'])->toDateString()
            : null;

        if ($from !== null && $to !== null && CarbonImmutable::parse($to)->lt(CarbonImmutable::parse($from))) {
            $to = CarbonImmutable::parse($from)->toDateString();
        }

        $perPage = (int) ($validated['per_page'] ?? 20);

        $activities = TrainingScope::forVisibleActivities($user)
            ->when(
                isset($validated['provider']),
                fn (Builder $query) => $query->where('provider', $validated['provider']),
            )
            ->when(
                $from !== null,
                fn (Builder $query) => $query->whereDate('started_at', '>=', $from),
            )
            ->when(
                $to !== null,
                fn (Builder $query) => $query->whereDate('started_at', '<=', $to),
            )
            ->orderByDesc('started_at')
            ->orderByDesc('id')
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
