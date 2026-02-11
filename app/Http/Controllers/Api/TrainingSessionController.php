<?php

namespace App\Http\Controllers\Api;

use App\Actions\TrainingSession\CompleteSessionAction;
use App\Actions\TrainingSession\LinkActivityAction;
use App\Actions\TrainingSession\RevertCompletionAction;
use App\Actions\TrainingSession\UnlinkActivityAction;
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
use App\Support\QueryScopes\TrainingScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class TrainingSessionController extends Controller
{
    public function __construct(
        private readonly LinkActivityAction $linkActivityAction,
        private readonly UnlinkActivityAction $unlinkActivityAction,
        private readonly CompleteSessionAction $completeSessionAction,
        private readonly RevertCompletionAction $revertCompletionAction,
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
        $perPage = (int) ($validated['per_page'] ?? 20);

        $sessions = TrainingScope::forVisibleSessions($request->user())
            ->with('activity')
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
     */
    public function store(StoreTrainingSessionRequest $request): JsonResponse
    {
        $this->authorize('create', TrainingSession::class);
        $validated = $request->validated();

        $trainingWeek = null;

        if (isset($validated['training_week_id']) && $validated['training_week_id'] !== null) {
            $trainingWeek = TrainingWeek::query()
                ->with('trainingPlan:id,user_id')
                ->findOrFail((int) $validated['training_week_id']);
            $this->authorize('update', $trainingWeek);
        }

        $ownerId = $trainingWeek?->trainingPlan?->user_id ?? $request->user()?->id;

        if ($ownerId === null) {
            throw ValidationException::withMessages([
                'training_week_id' => 'Unable to determine session owner.',
            ]);
        }

        $trainingSession = TrainingSession::query()->create([
            'user_id' => $ownerId,
            'training_week_id' => $trainingWeek?->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'status' => TrainingSessionStatus::Planned->value,
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'planned_structure' => $validated['planned_structure'] ?? null,
        ]);

        return (new TrainingSessionResource($trainingSession))
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
            $trainingWeek = TrainingWeek::query()
                ->with('trainingPlan:id,user_id')
                ->findOrFail((int) $validated['training_week_id']);
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

        $trainingSession->update([
            'user_id' => $ownerId,
            'training_week_id' => $trainingWeek?->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'planned_structure' => $validated['planned_structure'] ?? null,
        ]);

        return new TrainingSessionResource($trainingSession->refresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TrainingSession $trainingSession): \Illuminate\Http\Response
    {
        $this->authorize('delete', $trainingSession);

        $trainingSession->delete();

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
                'id' => $trainingSession->id,
                'linked_activity_id' => $linkedActivity->id,
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
                'id' => $trainingSession->id,
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
        ));
    }

    public function revertCompletion(
        RevertTrainingSessionCompletionRequest $request,
        TrainingSession $trainingSession,
    ): TrainingSessionResource {
        $this->authorize('revertCompletion', $trainingSession);

        return new TrainingSessionResource(
            $this->revertCompletionAction->execute($trainingSession),
        );
    }
}
