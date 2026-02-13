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

            $matchingResult = $this->findMatchingPlannedSession($athlete, $freshActivity);

            if ($matchingResult['ambiguous']) {
                return null;
            }

            $matchingSession = $matchingResult['session'];

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

    /**
     * @return array{session: TrainingSession|null, ambiguous: bool}
     */
    private function findMatchingPlannedSession(
        User $athlete,
        Activity $activity,
    ): array {
        $activitySport = $this->normalizeSport($activity->sport);
        $activityDate = $activity->started_at?->toDateString();

        if ($activityDate === null) {
            return ['session' => null, 'ambiguous' => false];
        }

        /** @var Collection<int, TrainingSession> $candidateSessions */
        $candidateSessions = TrainingSession::query()
            ->where('user_id', $athlete->id)
            ->whereDate('scheduled_date', $activityDate)
            ->where('sport', $activitySport)
            ->where('planning_source', TrainingSessionPlanningSource::Planned->value)
            ->whereNull('completed_at')
            ->whereDoesntHave('activity')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'duration_minutes',
            ]);

        if ($candidateSessions->isEmpty()) {
            return ['session' => null, 'ambiguous' => false];
        }

        if ($candidateSessions->count() > 1) {
            return ['session' => null, 'ambiguous' => true];
        }

        $candidate = $candidateSessions->first();

        if (! $candidate instanceof TrainingSession) {
            return ['session' => null, 'ambiguous' => false];
        }

        if (! $this->isWithinDurationTolerance($candidate, $activity)) {
            return ['session' => null, 'ambiguous' => false];
        }

        if (! $this->isWithinStartTimeProximity($candidate, $activity)) {
            return ['session' => null, 'ambiguous' => false];
        }

        return ['session' => $candidate, 'ambiguous' => false];
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

    private function isWithinDurationTolerance(
        TrainingSession $session,
        Activity $activity,
    ): bool {
        $plannedDurationMinutes = max(1, (int) $session->duration_minutes);
        $activityDurationMinutes = $this->activityDurationMinutes($activity);
        $durationDifference = abs($plannedDurationMinutes - $activityDurationMinutes);
        $maximumAllowedDifference = max(
            45,
            (int) round($plannedDurationMinutes * 0.85),
            (int) round($activityDurationMinutes * 0.85),
        );

        return $durationDifference <= $maximumAllowedDifference;
    }

    private function isWithinStartTimeProximity(
        TrainingSession $session,
        Activity $activity,
    ): bool {
        /**
         * Training sessions currently track a scheduled date without planned start times.
         * Keep this check explicit so time-aware proximity can be introduced later
         * without changing reconciliation flow shape.
         */
        return $activity->started_at !== null;
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
