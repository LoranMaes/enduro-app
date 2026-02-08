<?php

namespace App\Services\Activities;

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

class ExternalActivityPersister
{
    public function persist(User $athlete, ExternalActivityDTO $activity): Activity
    {
        $attributes = [
            'athlete_id' => $athlete->id,
            'provider' => $activity->provider,
            'external_id' => $activity->external_id,
        ];

        $values = [
            'sport' => $activity->sport,
            'started_at' => $activity->started_at,
            'duration_seconds' => $activity->duration_seconds,
            'distance_meters' => $activity->distance_meters,
            'elevation_gain_meters' => $activity->elevation_gain_meters,
            'raw_payload' => $activity->raw_payload,
            'training_session_id' => null,
        ];

        /** @var Activity|null $existingActivity */
        $existingActivity = Activity::query()
            ->withTrashed()
            ->where($attributes)
            ->first();

        if ($existingActivity instanceof Activity) {
            $existingActivity->forceFill($values);

            if ($existingActivity->trashed()) {
                $existingActivity->restore();
            }

            $existingActivity->save();

            return $existingActivity;
        }

        return Activity::query()->create([
            ...$attributes,
            ...$values,
        ]);
    }

    public function persistMany(User $athlete, ActivityCollection $activities): EloquentCollection
    {
        $persistedActivities = new EloquentCollection;

        foreach ($activities as $activity) {
            $persistedActivities->push(
                $this->persist($athlete, $activity),
            );
        }

        return $persistedActivities;
    }
}
