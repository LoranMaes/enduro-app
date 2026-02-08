<?php

namespace App\Http\Controllers\Api;

use App\Enums\TrainingSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LinkActivityToSessionRequest;
use App\Http\Requests\Api\ListTrainingSessionRequest;
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

        $trainingWeek = TrainingWeek::query()->findOrFail(
            (int) $validated['training_week_id'],
        );
        $this->authorize('update', $trainingWeek);

        $trainingSession = TrainingSession::query()->create([
            'training_week_id' => $trainingWeek->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'status' => TrainingSessionStatus::Planned->value,
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
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

        $trainingWeek = TrainingWeek::query()->findOrFail(
            (int) $validated['training_week_id'],
        );
        $this->authorize('update', $trainingWeek);

        $trainingSession->update([
            'training_week_id' => $trainingWeek->id,
            'scheduled_date' => $validated['date'],
            'sport' => $validated['sport'],
            'duration_minutes' => $validated['planned_duration_minutes'],
            'planned_tss' => $validated['planned_tss'] ?? null,
            'notes' => $validated['notes'] ?? null,
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

        if ($user->isCoach()) {
            return TrainingSession::query()->whereHas('trainingWeek.trainingPlan', function (Builder $query) use ($user): void {
                $query->whereIn(
                    'user_id',
                    $user->coachedAthletes()->select('users.id'),
                );
            });
        }

        return TrainingSession::query()->whereRaw('1 = 0');
    }
}
