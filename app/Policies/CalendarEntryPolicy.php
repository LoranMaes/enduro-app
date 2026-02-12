<?php

namespace App\Policies;

use App\Models\CalendarEntry;
use App\Models\User;

class CalendarEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAthlete();
    }

    public function view(User $user, CalendarEntry $calendarEntry): bool
    {
        return $user->isAthlete() && $calendarEntry->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAthlete();
    }

    public function update(User $user, CalendarEntry $calendarEntry): bool
    {
        return $user->isAthlete() && $calendarEntry->user_id === $user->id;
    }

    public function delete(User $user, CalendarEntry $calendarEntry): bool
    {
        return $user->isAthlete() && $calendarEntry->user_id === $user->id;
    }
}
