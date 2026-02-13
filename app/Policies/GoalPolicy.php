<?php

namespace App\Policies;

use App\Models\Goal;
use App\Models\User;
use App\Policies\Concerns\DetectsImpersonation;

class GoalPolicy
{
    use DetectsImpersonation;

    public function viewAny(User $user): bool
    {
        if ($this->canActAsAdmin($user)) {
            return true;
        }

        return $user->isAthlete();
    }

    public function view(User $user, Goal $goal): bool
    {
        if ($this->canActAsAdmin($user)) {
            return true;
        }

        return $user->isAthlete() && $goal->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        if ($this->canActAsAdmin($user)) {
            return true;
        }

        return $user->isAthlete();
    }

    public function update(User $user, Goal $goal): bool
    {
        if ($this->canActAsAdmin($user)) {
            return true;
        }

        return $user->isAthlete() && $goal->user_id === $user->id;
    }

    public function delete(User $user, Goal $goal): bool
    {
        if ($this->canActAsAdmin($user)) {
            return true;
        }

        return $user->isAthlete() && $goal->user_id === $user->id;
    }

    public function restore(User $user, Goal $goal): bool
    {
        return false;
    }

    public function forceDelete(User $user, Goal $goal): bool
    {
        return false;
    }

    private function canActAsAdmin(User $user): bool
    {
        return $user->isAdmin() && ! $this->isImpersonating();
    }
}
