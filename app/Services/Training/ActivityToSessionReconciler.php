<?php

namespace App\Services\Training;

use App\Actions\TrainingSession\CompleteSessionAction;
use App\Actions\TrainingSession\LinkActivityAction;
use App\Enums\TrainingSessionCompletionSource;
use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ActivityToSessionReconciler
{
    public function __construct(
        private readonly LinkActivityAction $linkActivityAction,
        private readonly CompleteSessionAction $completeSessionAction,
    ) {}

    public function reconcile(Activity $activity): ?TrainingSession
    {
        if ($activity->athlete_id === null || $activity->started_at === null) {
            return null;
        }

        $athlete = User::query()->find($activity->athlete_id);

        if (! $athlete instanceof User || ! $athlete->isAthlete()) {
            return null;
        }

        return DB::transaction(function () use ($activity, $athlete): ?TrainingSession {
            $freshActivity = Activity::query()
                ->whereKey($activity->id)
                ->lockForUpdate()
                ->first();

            if (! $freshActivity instanceof Activity || $freshActivity->started_at === null) {
                return null;
            }

            if ($freshActivity->training_session_id !== null) {
                $existingLinkedSession = $this->ensureSessionCompletion(
                    $athlete,
                    $freshActivity,
                    (int) $freshActivity->training_session_id,
                );

                if ($existingLinkedSession instanceof TrainingSession) {
                    return $existingLinkedSession;
                }
            }

            $matchingSession = $this->findMatchingPlannedSession($athlete, $freshActivity);

            if (! $matchingSession instanceof TrainingSession) {
                $matchingSession = $this->createUnplannedSession($athlete, $freshActivity);
            }

            $this->linkActivityIfMissing($athlete, $matchingSession, $freshActivity);

            return $this->completeSessionIfNeeded($athlete, $matchingSession);
        });
    }

    /**
     * @param  Collection<int, Activity>  $activities
     */
    public function reconcileMany(Collection $activities): void
    {
        foreach ($activities as $activity) {
            if (! $activity instanceof Activity) {
                continue;
            }

            $this->reconcile($activity);
        }
    }

    private function ensureSessionCompletion(
        User $athlete,
        Activity $activity,
        int $trainingSessionId,
    ): ?TrainingSession {
        $session = TrainingSession::query()
            ->whereKey($trainingSessionId)
            ->where('user_id', $athlete->id)
            ->first();

        if (! $session instanceof TrainingSession) {
            return null;
        }

        if (
            $session->status instanceof TrainingSessionStatus
            && $session->status === TrainingSessionStatus::Completed
        ) {
            if ($session->completion_source === null) {
                $session->forceFill([
                    'completion_source' => TrainingSessionCompletionSource::ProviderAuto->value,
                    'auto_completed_at' => $session->completed_at ?? now(),
                ])->save();
            }

            return $session->refresh()->loadMissing('activity');
        }

        return $this->completeSessionIfNeeded($athlete, $session);
    }

    private function completeSessionIfNeeded(
        User $athlete,
        TrainingSession $session,
    ): TrainingSession {
        if (
            $session->status instanceof TrainingSessionStatus
            && $session->status === TrainingSessionStatus::Completed
        ) {
            return $session->refresh()->loadMissing('activity');
        }

        return $this->completeSessionAction->execute(
            $athlete,
            $session,
            TrainingSessionCompletionSource::ProviderAuto,
        );
    }

    private function findMatchingPlannedSession(
        User $athlete,
        Activity $activity,
    ): ?TrainingSession {
        $activitySport = $this->normalizeSport($activity->sport);
        $activityDate = $activity->started_at?->toDateString();

        if ($activityDate === null) {
            return null;
        }

        $activityDurationMinutes = $this->activityDurationMinutes($activity);

        /** @var Collection<int, TrainingSession> $candidateSessions */
        $candidateSessions = TrainingSession::query()
            ->where('user_id', $athlete->id)
            ->whereDate('scheduled_date', $activityDate)
            ->where('sport', $activitySport)
            ->where('planning_source', TrainingSessionPlanningSource::Planned->value)
            ->whereDoesntHave('activity')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'duration_minutes',
            ]);

        if ($candidateSessions->isEmpty()) {
            return null;
        }

        $bestSession = $candidateSessions
            ->sortBy(function (TrainingSession $session) use ($activityDurationMinutes): int {
                return abs($session->duration_minutes - $activityDurationMinutes);
            })
            ->first();

        if (! $bestSession instanceof TrainingSession) {
            return null;
        }

        if ($candidateSessions->count() === 1) {
            return $bestSession;
        }

        $durationDifference = abs(
            $bestSession->duration_minutes - $activityDurationMinutes,
        );
        $maximumAllowedDifference = max(
            20,
            (int) round($activityDurationMinutes * 0.5),
        );

        if ($durationDifference > $maximumAllowedDifference) {
            return null;
        }

        return $bestSession;
    }

    private function createUnplannedSession(
        User $athlete,
        Activity $activity,
    ): TrainingSession {
        return TrainingSession::query()->create([
            'user_id' => $athlete->id,
            'training_week_id' => null,
            'scheduled_date' => $activity->started_at?->toDateString(),
            'sport' => $this->normalizeSport($activity->sport),
            'title' => 'Free Workout',
            'status' => TrainingSessionStatus::Planned->value,
            'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
            'duration_minutes' => $this->activityDurationMinutes($activity),
            'planned_tss' => null,
            'notes' => 'Free Workout',
            'planned_structure' => null,
        ]);
    }

    private function linkActivityIfMissing(
        User $athlete,
        TrainingSession $session,
        Activity $activity,
    ): void {
        if ((int) ($activity->training_session_id ?? 0) === $session->id) {
            return;
        }

        try {
            $this->linkActivityAction->execute($athlete, $session, $activity);
        } catch (ValidationException) {
            return;
        }
    }

    private function activityDurationMinutes(Activity $activity): int
    {
        if ($activity->duration_seconds === null || $activity->duration_seconds <= 0) {
            return 30;
        }

        return max(1, (int) round($activity->duration_seconds / 60));
    }

    private function normalizeSport(string $sport): string
    {
        $normalizedSport = strtolower(trim($sport));

        if ($normalizedSport === '') {
            return 'other';
        }

        return match ($normalizedSport) {
            'swim', 'bike', 'run', 'gym', 'other', 'day_off', 'mtn_bike', 'custom', 'walk' => $normalizedSport,
            'ride', 'cycling', 'virtualride', 'ebikeride' => 'bike',
            'mountainbike', 'mountainbiking' => 'mtn_bike',
            'strength', 'workout' => 'gym',
            'hike', 'walking' => 'walk',
            default => 'other',
        };
    }
}
