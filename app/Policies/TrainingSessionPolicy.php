<?php

namespace App\Policies;

use App\Models\TrainingSession;
use App\Models\User;

class TrainingSessionPolicy
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
        return $user->isAthlete() || $user->isCoach();
    }

    public function view(User $user, TrainingSession $trainingSession): bool
    {
        $athlete = $trainingSession->trainingWeek->trainingPlan->user;

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

        /** @todo Allow coaches to create sessions for assigned athletes. */
        return false;
    }

    public function update(User $user, TrainingSession $trainingSession): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingSession->trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function delete(User $user, TrainingSession $trainingSession): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingSession->trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function restore(User $user, TrainingSession $trainingSession): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return $trainingSession->trainingWeek->trainingPlan->user->is($user);
        }

        return false;
    }

    public function forceDelete(User $user, TrainingSession $trainingSession): bool
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

    private function isImpersonating(): bool
    {
        $request = request();

        if ($request === null || ! $request->hasSession()) {
            return false;
        }

        return $request->session()->has('impersonation.original_user_id')
            && $request->session()->has('impersonation.impersonated_user_id');
    }
}
