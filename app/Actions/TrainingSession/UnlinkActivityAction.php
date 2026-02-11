<?php

namespace App\Actions\TrainingSession;

use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class UnlinkActivityAction
{
    public function execute(User $user, TrainingSession $trainingSession): Activity
    {
        $linkedActivity = Activity::query()
            ->where('training_session_id', $trainingSession->id)
            ->first();

        if (! $linkedActivity instanceof Activity) {
            throw ValidationException::withMessages([
                'activity_id' => 'No activity is currently linked to this session.',
            ]);
        }

        if ($linkedActivity->athlete_id !== $user->id) {
            throw ValidationException::withMessages([
                'activity_id' => 'The linked activity is invalid.',
            ]);
        }

        $linkedActivity->training_session_id = null;
        $linkedActivity->save();

        return $linkedActivity;
    }
}
