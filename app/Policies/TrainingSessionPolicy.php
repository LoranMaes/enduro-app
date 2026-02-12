<?php

namespace App\Policies;

use App\Models\TrainingSession;
use App\Models\User;

class TrainingSessionPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if (
            $user->isAdmin()
            && in_array(
                $ability,
                ['linkActivity', 'unlinkActivity', 'complete', 'revertCompletion'],
                true,
            )
        ) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isAthlete() || $user->isCoach();
    }

    public function view(User $user, TrainingSession $trainingSession): bool
    {
        $athleteId = $this->resolveAthleteId($trainingSession);

        if ($athleteId === null) {
            return false;
        }

        if ($user->isAthlete()) {
            return $athleteId === $user->id;
        }

        if ($user->isCoach()) {
            return $this->canCoachAccessAthleteId($user, $athleteId);
        }

        return false;
    }

    public function create(User $user): bool
    {
        if ($user->isAthlete()) {
            return true;
        }

        /** @todo Allow coaches to create sessions for assigned athletes. */
        return false;
    }

    public function update(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function delete(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function restore(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function forceDelete(User $user, TrainingSession $trainingSession): bool
    {
        return false;
    }

    public function linkActivity(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function unlinkActivity(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function complete(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    public function revertCompletion(User $user, TrainingSession $trainingSession): bool
    {
        if ($user->isAthlete()) {
            return $this->resolveAthleteId($trainingSession) === $user->id;
        }

        return false;
    }

    private function canCoachAccessAthleteId(User $coach, int $athleteId): bool
    {
        return $coach
            ->coachedAthletes()
            ->whereKey($athleteId)
            ->exists();
    }

    private function resolveAthleteId(TrainingSession $trainingSession): ?int
    {
        if ($trainingSession->user_id !== null) {
            return $trainingSession->user_id;
        }

        $trainingWeek = $trainingSession->relationLoaded('trainingWeek')
            ? $trainingSession->trainingWeek
            : $trainingSession->trainingWeek()
                ->select('id', 'training_plan_id')
                ->with('trainingPlan:id,user_id')
                ->first();

        return $trainingWeek?->trainingPlan?->user_id;
    }
}
