<?php

namespace App\Actions\TrainingSession;

use App\Actions\Load\DispatchRecentLoadRecalculation;
use App\Enums\TrainingSessionStatus;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class RevertCompletionAction
{
    public function __construct(
        private readonly DispatchRecentLoadRecalculation $dispatchRecentLoadRecalculation,
    ) {}

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

        $owner = User::query()->find($trainingSession->user_id);

        if ($owner instanceof User && $owner->isAthlete()) {
            $this->dispatchRecentLoadRecalculation->execute($owner, 60);
        }

        return $trainingSession->refresh()->loadMissing('activity');
    }
}
