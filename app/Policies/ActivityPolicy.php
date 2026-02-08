<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
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

    public function view(User $user, Activity $activity): bool
    {
        $athlete = $this->resolveAthlete($activity);

        if (! $athlete instanceof User) {
            return false;
        }

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

        return false;
    }

    public function update(User $user, Activity $activity): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        $athlete = $this->resolveAthlete($activity);

        if (! $athlete instanceof User) {
            return false;
        }

        if ($user->isAthlete()) {
            return $athlete->is($user);
        }

        return false;
    }

    public function delete(User $user, Activity $activity): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        $athlete = $this->resolveAthlete($activity);

        if (! $athlete instanceof User) {
            return false;
        }

        if ($user->isAthlete()) {
            return $athlete->is($user);
        }

        return false;
    }

    public function restore(User $user, Activity $activity): bool
    {
        return $this->delete($user, $activity);
    }

    public function forceDelete(User $user, Activity $activity): bool
    {
        if ($this->isImpersonating()) {
            return false;
        }

        return false;
    }

    private function resolveAthlete(Activity $activity): ?User
    {
        if ($activity->relationLoaded('athlete') && $activity->athlete instanceof User) {
            return $activity->athlete;
        }

        if ($activity->athlete_id !== null) {
            return $activity->athlete()->first();
        }

        if (
            $activity->trainingSession !== null
            && $activity->trainingSession->trainingWeek !== null
            && $activity->trainingSession->trainingWeek->trainingPlan !== null
        ) {
            return $activity->trainingSession->trainingWeek->trainingPlan->user;
        }

        return null;
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
