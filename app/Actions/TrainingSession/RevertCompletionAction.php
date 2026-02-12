<?php

namespace App\Actions\TrainingSession;

use App\Enums\TrainingSessionStatus;
use App\Models\TrainingSession;
use Illuminate\Validation\ValidationException;

class RevertCompletionAction
{
    public function execute(TrainingSession $trainingSession): TrainingSession
    {
        if (
            ! ($trainingSession->status instanceof TrainingSessionStatus)
            || $trainingSession->status !== TrainingSessionStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'session' => 'Only completed sessions can be reverted.',
            ]);
        }

        $trainingSession->update([
            'status' => TrainingSessionStatus::Planned->value,
            'actual_duration_minutes' => null,
            'actual_tss' => null,
            'completed_at' => null,
            'completion_source' => null,
            'auto_completed_at' => null,
        ]);

        return $trainingSession->refresh()->loadMissing('activity');
    }
}
