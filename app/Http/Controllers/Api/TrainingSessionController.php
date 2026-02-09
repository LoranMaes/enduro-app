<?php

namespace App\Http\Controllers\Api;

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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
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

        if ($activity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The selected activity is invalid.',
            ]);
        }

        if (
            $activity->training_session_id !== null &&
            $activity->training_session_id !== $trainingSession->id
        ) {
            throw ValidationException::withMessages([
                'activity_id' => 'This activity is already linked to another session.',
            ]);
        }

        $conflictingLinkExists = Activity::query()
            ->where('training_session_id', $trainingSession->id)
            ->where('id', '!=', $activity->id)
            ->exists();

        if ($conflictingLinkExists) {
            throw ValidationException::withMessages([
                'activity_id' => 'This session already has a linked activity. Unlink it first.',
            ]);
        }

        $activity->training_session_id = $trainingSession->id;
        $activity->save();
        $activity->loadMissing('trainingSession');

        return response()->json([
            'activity' => (new ActivityResource($activity))->resolve(),
            'session' => [
                'id' => $trainingSession->id,
                'linked_activity_id' => $activity->id,
            ],
        ]);
    }

    public function unlinkActivity(
        UnlinkActivityFromSessionRequest $request,
        TrainingSession $trainingSession,
    ): JsonResponse {
        $this->authorize('unlinkActivity', $trainingSession);

        $linkedActivity = Activity::query()
            ->where('training_session_id', $trainingSession->id)
            ->first();
        $user = $request->user();

        if (! $linkedActivity instanceof Activity || ! $user instanceof User) {
            throw ValidationException::withMessages([
                'activity_id' => 'No activity is currently linked to this session.',
            ]);
        }

        if ($linkedActivity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        $linkedActivity->training_session_id = null;
        $linkedActivity->save();

        return response()->json([
            'activity' => (new ActivityResource($linkedActivity))->resolve(),
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

        $trainingSession->loadMissing('activity');

        if (
            $trainingSession->status instanceof TrainingSessionStatus
            && $trainingSession->status === TrainingSessionStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'session' => 'This session is already completed.',
            ]);
        }

        $linkedActivity = $trainingSession->activity;
        $user = $request->user();

        if (! $linkedActivity instanceof Activity) {
            throw ValidationException::withMessages([
                'activity_id' => 'Link an activity before completing this session.',
            ]);
        }

        if (! $user instanceof User || $linkedActivity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        $actualDurationMinutes = $this->mapDurationSecondsToMinutes(
            $linkedActivity->duration_seconds,
        );

        $trainingSession->update([
            'status' => TrainingSessionStatus::Completed->value,
            'actual_duration_minutes' => $actualDurationMinutes,
            'actual_tss' => $this->resolveActualTssFromActivity($linkedActivity),
            'completed_at' => now(),
        ]);

        return new TrainingSessionResource(
            $trainingSession->refresh()->loadMissing('activity'),
        );
    }

    public function revertCompletion(
        RevertTrainingSessionCompletionRequest $request,
        TrainingSession $trainingSession,
    ): TrainingSessionResource {
        $this->authorize('revertCompletion', $trainingSession);

        if (
            ! ($trainingSession->status instanceof TrainingSessionStatus)
            || $trainingSession->status !== TrainingSessionStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'session' => 'Only completed sessions can be reverted.',
            ]);
        }

        $trainingSession->update([
            'status' => TrainingSessionStatus::Planned->value,
            'actual_duration_minutes' => null,
            'actual_tss' => null,
            'completed_at' => null,
        ]);

        return new TrainingSessionResource(
            $trainingSession->refresh()->loadMissing('activity'),
        );
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingSession::query();
        }

        if ($user->isAthlete()) {
            return TrainingSession::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingSession::query()->whereIn(
                'user_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return TrainingSession::query()->whereRaw('1 = 0');
    }

    private function mapDurationSecondsToMinutes(?int $durationSeconds): ?int
    {
        if ($durationSeconds === null || $durationSeconds <= 0) {
            return null;
        }

        return max(1, (int) round($durationSeconds / 60));
    }

    private function resolveActualTssFromActivity(Activity $activity): ?int
    {
        $rawPayload = $activity->raw_payload;

        if (! is_array($rawPayload)) {
            return null;
        }

        if (! array_key_exists('tss', $rawPayload)) {
            return null;
        }

        $value = $rawPayload['tss'];

        if (is_int($value)) {
            return $value >= 0 ? $value : null;
        }

        if (is_numeric($value)) {
            $normalized = (int) round((float) $value);

            return $normalized >= 0 ? $normalized : null;
        }

        return null;
    }
}
