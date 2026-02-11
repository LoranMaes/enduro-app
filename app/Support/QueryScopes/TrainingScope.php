<?php

namespace App\Support\QueryScopes;

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TrainingScope
{
    public static function forVisiblePlans(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingPlan::query();
        }

        if ($user->isAthlete()) {
            return TrainingPlan::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingPlan::query()->whereIn(
                'user_id',
                self::coachedAthleteIds($user),
            );
        }

        return TrainingPlan::query()->whereRaw('1 = 0');
    }

    public static function forVisibleWeeks(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingWeek::query();
        }

        if ($user->isAthlete()) {
            return TrainingWeek::query()->whereHas('trainingPlan', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id);
            });
        }

        if ($user->isCoach()) {
            return TrainingWeek::query()->whereHas('trainingPlan', function (Builder $query) use ($user): void {
                $query->whereIn('user_id', self::coachedAthleteIds($user));
            });
        }

        return TrainingWeek::query()->whereRaw('1 = 0');
    }

    public static function forVisibleSessions(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingSession::query();
        }

        if ($user->isAthlete()) {
            return TrainingSession::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingSession::query()->whereIn(
                'user_id',
                self::coachedAthleteIds($user),
            );
        }

        return TrainingSession::query()->whereRaw('1 = 0');
    }

    public static function forVisibleActivities(User $user): Builder
    {
        if ($user->isAdmin()) {
            return Activity::query();
        }

        if ($user->isAthlete()) {
            return Activity::query()->where('athlete_id', $user->id);
        }

        if ($user->isCoach()) {
            return Activity::query()->whereIn(
                'athlete_id',
                self::coachedAthleteIds($user),
            );
        }

        return Activity::query()->whereRaw('1 = 0');
    }

    private static function coachedAthleteIds(User $user): BelongsToMany
    {
        return $user->coachedAthletes()->select('users.id');
    }
}
