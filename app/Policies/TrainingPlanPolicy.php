<?php

namespace App\Policies;

use App\Models\TrainingPlan;
use App\Models\User;

class TrainingPlanPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TrainingPlan $trainingPlan): bool
    {
        if ($user->isAthlete()) {
            return $trainingPlan->user_id === $user->id;
        }

        if ($user->isCoach()) {
            return $this->canCoachAccessAthlete($user, $trainingPlan->user);
        }

        return false;
    }

    public function create(User $user): bool
    {
        if ($user->isAthlete()) {
            return true;
        }

        /** @todo Allow coaches to create plans for assigned athletes. */
        return false;
    }

    public function update(User $user, TrainingPlan $trainingPlan): bool
    {
        if ($user->isAthlete()) {
            return $trainingPlan->user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, TrainingPlan $trainingPlan): bool
    {
        if ($user->isAthlete()) {
            return $trainingPlan->user_id === $user->id;
        }

        return false;
    }

    public function restore(User $user, TrainingPlan $trainingPlan): bool
    {
        if ($user->isAthlete()) {
            return $trainingPlan->user_id === $user->id;
        }

        return false;
    }

    public function forceDelete(User $user, TrainingPlan $trainingPlan): bool
    {
        return false;
    }

    private function canCoachAccessAthlete(User $coach, User $athlete): bool
    {
        return $coach
            ->coachedAthletes()
            ->whereKey($athlete->id)
            ->exists();
    }
}
