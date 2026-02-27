<?php

namespace App\Actions\TrainingSession;

use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LinkActivityAction
{
    public function execute(User $user, TrainingSession $trainingSession, Activity $activity): Activity
    {
        if ($activity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The selected activity is invalid.',
            ]);
        }

        if (
            $activity->training_session_id !== null &&
            $activity->training_session_id !== $trainingSession->id
        ) {
            throw ValidationException::withMessages([
                'activity_id' => 'This activity is already linked to another session.',
            ]);
        }

        $conflictingLinkExists = Activity::query()
            ->where('training_session_id', $trainingSession->id)
            ->where('id', '!=', $activity->id)
            ->exists();

        if ($conflictingLinkExists) {
            throw ValidationException::withMessages([
                'activity_id' => 'This session already has a linked activity. Unlink it first.',
            ]);
        }

        $activity->training_session_id = $trainingSession->id;
        $activity->save();
        $activity->loadMissing('trainingSession');

        return $activity;
    }
}
