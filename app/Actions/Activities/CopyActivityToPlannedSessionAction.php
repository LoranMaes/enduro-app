<?php

namespace App\Actions\Activities;

use App\Actions\Load\DispatchRecentLoadRecalculation;
use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class CopyActivityToPlannedSessionAction
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
        private readonly DispatchRecentLoadRecalculation $dispatchRecentLoadRecalculation,
    ) {}

    public function execute(Activity $activity, User $actor): TrainingSession
    {
        $activity->loadMissing('athlete', 'trainingSession');

        $owner = $activity->athlete;

        if (! $owner instanceof User && $activity->athlete_id !== null) {
            $owner = User::query()->find($activity->athlete_id);
        }

        if (! $owner instanceof User) {
            throw ValidationException::withMessages([
                'activity' => 'Unable to determine the athlete for this activity.',
            ]);
        }

        if ($actor->isAthlete() && ! $owner->is($actor)) {
            throw ValidationException::withMessages([
                'activity' => 'You cannot copy this activity.',
            ]);
        }

        $timezone = $owner->timezone ?? config('app.timezone', 'UTC');
        $scheduledDate = $activity->started_at !== null
            ? CarbonImmutable::parse($activity->started_at)
                ->timezone($timezone)
                ->toDateString()
            : CarbonImmutable::now($timezone)->toDateString();
        $durationMinutes = $this->actualMetricsResolver->resolveActivityDurationMinutes($activity) ?? 1;

        $trainingSession = TrainingSession::query()->create([
            'user_id' => $owner->id,
            'training_week_id' => null,
            'scheduled_date' => $scheduledDate,
            'sport' => $activity->sport ?: 'other',
            'title' => 'Copied activity',
            'status' => TrainingSessionStatus::Planned->value,
            'planning_source' => TrainingSessionPlanningSource::Planned->value,
            'completion_source' => null,
            'duration_minutes' => max(1, $durationMinutes),
            'planned_tss' => $this->actualMetricsResolver->resolveActivityTss(
                $activity,
                $owner,
            ),
            'notes' => null,
            'planned_structure' => null,
        ]);

        if ($owner->isAthlete()) {
            $this->dispatchRecentLoadRecalculation->execute($owner, 60);
        }

        return $trainingSession;
    }
}
