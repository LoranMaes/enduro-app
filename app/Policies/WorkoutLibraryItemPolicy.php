<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkoutLibraryItem;

class WorkoutLibraryItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAthlete();
    }

    public function view(User $user, WorkoutLibraryItem $workoutLibraryItem): bool
    {
        return $user->isAthlete() && $workoutLibraryItem->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAthlete();
    }

    public function update(User $user, WorkoutLibraryItem $workoutLibraryItem): bool
    {
        return $user->isAthlete() && $workoutLibraryItem->user_id === $user->id;
    }

    public function delete(User $user, WorkoutLibraryItem $workoutLibraryItem): bool
    {
        return $user->isAthlete() && $workoutLibraryItem->user_id === $user->id;
    }
}
