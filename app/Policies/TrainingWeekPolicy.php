<?php

namespace App\Policies;

use App\Models\TrainingWeek;
use App\Models\User;
use App\Policies\Concerns\DetectsImpersonation;

class TrainingWeekPolicy
{
    use DetectsImpersonation;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isAthlete() || $user->isCoach();
    }

    public function view(User $user, TrainingWeek $trainingWeek): bool
    {
        $athlete = $trainingWeek->trainingPlan->user;

        if ($user->isAthlete()) {
            return $athlete->is($user);
        }

        if ($user->isCoach()) {
            return $this->canCoachAccessAthlete($user, $athlete);
        }

        return false;
    }

    public function create(User $user): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return true;
        }

        /** @todo Allow coaches to create weeks for assigned athletes. */
        return false;
    }

    public function update(User $user, TrainingWeek $trainingWeek): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function delete(User $user, TrainingWeek $trainingWeek): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function restore(User $user, TrainingWeek $trainingWeek): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function forceDelete(User $user, TrainingWeek $trainingWeek): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

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
