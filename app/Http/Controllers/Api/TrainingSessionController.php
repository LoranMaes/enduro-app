<?php

namespace App\Http\Controllers\Api;

use App\Actions\Load\DispatchRecentLoadRecalculation;
use App\Actions\TrainingSession\CompleteSessionAction;
use App\Actions\TrainingSession\LinkActivityAction;
use App\Actions\TrainingSession\RevertCompletionAction;
use App\Actions\TrainingSession\UnlinkActivityAction;
use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CompleteTrainingSessionRequest;
use App\Http\Requests\Api\LinkActivityToSessionRequest;
use App\Http\Requests\Api\ListTrainingSessionRequest;
use App\Http\Requests\Api\RevertTrainingSessionCompletionRequest;
use App\Http\Requests\Api\StoreTrainingSessionRequest;
use App\Http\Requests\Api\UnlinkActivityFromSessionRequest;
use App\Http\Requests\Api\UpdateTrainingSessionRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\TrainingSessionResource;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use App\Services\Calendar\HistoryWindowLimiter;
use App\Services\Entitlements\EntryTypeEntitlementService;
use App\Support\QueryScopes\TrainingScope;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Laravel\Pennant\Feature;
use Symfony\Component\HttpFoundation\Response;

class TrainingSessionController extends Controller
{
    public function __construct(
        private readonly LinkActivityAction $linkActivityAction,
        private readonly UnlinkActivityAction $unlinkActivityAction,
        private readonly CompleteSessionAction $completeSessionAction,
        private readonly RevertCompletionAction $revertCompletionAction,
        private readonly EntryTypeEntitlementService $entryTypeEntitlementService,
        private readonly HistoryWindowLimiter $historyWindowLimiter,
        private readonly DispatchRecentLoadRecalculation $dispatchRecentLoadRecalculation,
    ) {}

    /**
     * Display a listing of the resource.
     *
     * @todo Implement training session listing with policy-aware query scoping.
     */
    public function index(ListTrainingSessionRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TrainingSession::class);
        $validated = $request->validated();
        $user = $request->user();
        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);

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

        $sessions = TrainingScope::forVisibleSessions($user)
            ->with(['activity', 'trainingWeek'])
            ->when(
                $from !== null,
                fn (Builder $query) => $query->whereDate('scheduled_date', '>=', $from),
            )
            ->when(
                $to !== null,
                fn (Builder $query) => $query->whereDate('scheduled_date', '<=', $to),
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
     */
    public function store(StoreTrainingSessionRequest $request): JsonResponse
    {
        $this->authorize('create', TrainingSession::class);
        $validated = $request->validated();

        $trainingWeek = null;

        if (isset($validated['training_week_id']) && $validated['training_week_id'] !== null) {
            $trainingWeek = $this->resolveTrainingWeekForMutation($validated['training_week_id']);
            $this->authorize('update', $trainingWeek);
        }

        $ownerId = $trainingWeek?->trainingPlan?->user_id ?? $request->user()?->id;

        if ($ownerId === null) {
            throw ValidationException::withMessages([
                'training_week_id' => 'Unable to determine session owner.',
            ]);
        }

        $this->ensureWorkoutEntitlement(
            sport: $validated['sport'],
            user: $request->user(),
        );
        $this->ensureStructureBuilderEntitlement(
            user: $request->user(),
            plannedStructure: $validated['planned_structure'] ?? null,
        );

        $trainingSession = TrainingSession::query()->create([
            'user_id' => $ownerId,
            'training_week_id' => $trainingWeek?->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'title' => $validated['title'] ?? null,
            'status' => TrainingSessionStatus::Planned->value,
            'planning_source' => TrainingSessionPlanningSource::Planned->value,
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'planned_structure' => $validated['planned_structure'] ?? null,
        ]);

        $owner = User::query()->find($ownerId);

        if ($owner instanceof User && $owner->isAthlete()) {
            $this->dispatchRecentLoadRecalculation->execute($owner, 60);
        }

        return (new TrainingSessionResource($trainingSession->loadMissing([
            'trainingWeek',
            'activity',
        ])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * @todo Implement single training session retrieval.
     */
    public function show(Request $request, TrainingSession $trainingSession): TrainingSessionResource
    {
        $this->authorize('view', $trainingSession);
        $request->attributes->set('include_suggested_activities', true);

        $trainingSession->loadMissing([
            'trainingWeek.trainingPlan',
            'activity',
        ]);

        return new TrainingSessionResource($trainingSession);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTrainingSessionRequest $request, TrainingSession $trainingSession): TrainingSessionResource
    {
        $this->authorize('update', $trainingSession);
        $validated = $request->validated();

        $trainingWeek = null;

        if (isset($validated['training_week_id']) && $validated['training_week_id'] !== null) {
            $trainingWeek = $this->resolveTrainingWeekForMutation($validated['training_week_id']);
            $this->authorize('update', $trainingWeek);
        }

        $ownerId = $trainingWeek?->trainingPlan?->user_id
            ?? $trainingSession->user_id
            ?? $request->user()?->id;

        if ($ownerId === null) {
            throw ValidationException::withMessages([
                'training_week_id' => 'Unable to determine session owner.',
            ]);
        }

        if (
            array_key_exists('sport', $validated)
            && $validated['sport'] !== $trainingSession->sport
        ) {
            $this->ensureWorkoutEntitlement(
                sport: $validated['sport'],
                user: $request->user(),
            );
        }
        $this->ensureStructureBuilderEntitlement(
            user: $request->user(),
            plannedStructure: $validated['planned_structure'] ?? null,
        );

        $trainingSession->update([
            'user_id' => $ownerId,
            'training_week_id' => $trainingWeek?->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'title' => array_key_exists('title', $validated)
                ? $validated['title']
                : $trainingSession->title,
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'planned_structure' => $validated['planned_structure'] ?? null,
        ]);

        if ($trainingSession->wasChanged([
            'training_week_id',
            'scheduled_date',
            'duration_minutes',
            'planned_tss',
        ])) {
            $owner = User::query()->find($ownerId);

            if ($owner instanceof User && $owner->isAthlete()) {
                $this->dispatchRecentLoadRecalculation->execute($owner, 60);
            }
        }

        return new TrainingSessionResource($trainingSession->refresh()->loadMissing([
            'trainingWeek',
            'activity',
        ]));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TrainingSession $trainingSession): \Illuminate\Http\Response
    {
        $this->authorize('delete', $trainingSession);
        $owner = User::query()->find($trainingSession->user_id);

        $trainingSession->delete();

        if ($owner instanceof User && $owner->isAthlete()) {
            $this->dispatchRecentLoadRecalculation->execute($owner, 60);
        }

        return response()->noContent();
    }

    public function linkActivity(
        LinkActivityToSessionRequest $request,
        TrainingSession $trainingSession,
    ): JsonResponse {
        $this->authorize('linkActivity', $trainingSession);

        $activity = $request->activity();
        $user = $request->user();

        if (! $activity instanceof Activity || ! $user instanceof User) {
            throw ValidationException::withMessages([
                'activity_id' => 'The selected activity is invalid.',
            ]);
        }

        $linkedActivity = $this->linkActivityAction->execute($user, $trainingSession, $activity);

        return response()->json([
            'activity' => (new ActivityResource($linkedActivity))->resolve(),
            'session' => [
                'id' => $trainingSession->getRouteKey(),
                'linked_activity_id' => $linkedActivity->getRouteKey(),
            ],
        ]);
    }

    public function unlinkActivity(
        UnlinkActivityFromSessionRequest $request,
        TrainingSession $trainingSession,
    ): JsonResponse {
        $this->authorize('unlinkActivity', $trainingSession);

        $user = $request->user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        $unlinkedActivity = $this->unlinkActivityAction->execute($user, $trainingSession);

        return response()->json([
            'activity' => (new ActivityResource($unlinkedActivity))->resolve(),
            'session' => [
                'id' => $trainingSession->getRouteKey(),
                'linked_activity_id' => null,
            ],
        ]);
    }

    public function complete(
        CompleteTrainingSessionRequest $request,
        TrainingSession $trainingSession,
    ): TrainingSessionResource {
        $this->authorize('complete', $trainingSession);

        $user = $request->user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        return new TrainingSessionResource($this->completeSessionAction->execute(
            $user,
            $trainingSession,
        )->loadMissing([
            'trainingWeek',
            'activity',
        ]));
    }

    public function revertCompletion(
        RevertTrainingSessionCompletionRequest $request,
        TrainingSession $trainingSession,
    ): TrainingSessionResource {
        $this->authorize('revertCompletion', $trainingSession);

        return new TrainingSessionResource(
            $this->revertCompletionAction->execute($trainingSession)->loadMissing([
                'trainingWeek',
                'activity',
            ]),
        );
    }

    private function ensureWorkoutEntitlement(string $sport, ?User $user): void
    {
        if (! $user instanceof User) {
            return;
        }

        if ($user->is_subscribed) {
            return;
        }

        $entryTypeKey = sprintf('workout.%s', $sport);

        if (! $this->entryTypeEntitlementService->requiresSubscription($entryTypeKey)) {
            return;
        }

        throw ValidationException::withMessages([
            'sport' => 'This workout type requires an active subscription.',
        ]);
    }

    private function resolveTrainingWeekForMutation(mixed $trainingWeekId): TrainingWeek
    {
        $trainingWeek = (new TrainingWeek)->resolveRouteBinding($trainingWeekId);

        if ($trainingWeek instanceof TrainingWeek) {
            return $trainingWeek->loadMissing('trainingPlan:id,user_id');
        }

        if (is_numeric($trainingWeekId)) {
            $legacyTrainingWeek = TrainingWeek::query()
                ->with('trainingPlan:id,user_id')
                ->find((int) $trainingWeekId);

            if ($legacyTrainingWeek instanceof TrainingWeek) {
                return $legacyTrainingWeek;
            }
        }

        throw ValidationException::withMessages([
            'training_week_id' => 'The selected training week id is invalid.',
        ]);
    }

    private function ensureStructureBuilderEntitlement(?User $user, mixed $plannedStructure): void
    {
        if (! $user instanceof User) {
            return;
        }

        if (! $this->hasStructureSteps($plannedStructure)) {
            return;
        }

        if (Feature::for($user)->active('workout.structure_builder')) {
            return;
        }

        throw ValidationException::withMessages([
            'planned_structure' => 'Workout structure requires an active subscription.',
        ]);
    }

    private function hasStructureSteps(mixed $plannedStructure): bool
    {
        if (! is_array($plannedStructure)) {
            return false;
        }

        if (! array_key_exists('steps', $plannedStructure)) {
            return false;
        }

        if (! is_array($plannedStructure['steps'])) {
            return false;
        }

        return count($plannedStructure['steps']) > 0;
    }

    private function ensureStructureBuilderEntitlementForUpdate(
        ?User $user,
        mixed $plannedStructure,
        mixed $existingPlannedStructure,
    ): void {
        if (! $user instanceof User) {
            return;
        }

        if (! $this->hasStructureSteps($plannedStructure)) {
            return;
        }

        if (Feature::for($user)->active('workout.structure_builder')) {
            return;
        }

        if ($this->structuresMatch($plannedStructure, $existingPlannedStructure)) {
            return;
        }

        throw ValidationException::withMessages([
            'planned_structure' => 'Workout structure requires an active subscription.',
        ]);
    }

    private function structuresMatch(mixed $left, mixed $right): bool
    {
        if (! is_array($left) || ! is_array($right)) {
            return false;
        }

        return json_encode($left) === json_encode($right);
    }
}
