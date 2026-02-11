<?php

namespace App\Actions\TrainingSession;

use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Illuminate\Validation\ValidationException;

class CompleteSessionAction
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
    ) {}

    public function execute(User $user, TrainingSession $trainingSession): TrainingSession
    {
        $trainingSession->loadMissing('activity');

        if (
            $trainingSession->status instanceof TrainingSessionStatus
            && $trainingSession->status === TrainingSessionStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'session' => 'This session is already completed.',
            ]);
        }

        $linkedActivity = $trainingSession->activity;

        if (! $linkedActivity instanceof Activity) {
            throw ValidationException::withMessages([
                'activity_id' => 'Link an activity before completing this session.',
            ]);
        }

        if ($linkedActivity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        $actualDurationMinutes = $this->actualMetricsResolver->resolveActivityDurationMinutes(
            $linkedActivity,
        );

        $trainingSession->update([
            'status' => TrainingSessionStatus::Completed->value,
            'actual_duration_minutes' => $actualDurationMinutes,
            'actual_tss' => $this->actualMetricsResolver->resolveActivityTss($linkedActivity, $user),
            'completed_at' => now(),
        ]);

        return $trainingSession->refresh()->loadMissing('activity');
    }
}
