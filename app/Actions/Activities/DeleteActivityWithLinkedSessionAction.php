<?php

namespace App\Actions\Activities;

use App\Actions\Load\DispatchRecentLoadRecalculation;
use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteActivityWithLinkedSessionAction
{
    public function __construct(
        private readonly DispatchRecentLoadRecalculation $dispatchRecentLoadRecalculation,
    ) {}

    /**
     * @return array{linked_session_deleted: bool}
     */
    public function execute(Activity $activity, User $actor): array
    {
        $activity->loadMissing('trainingSession', 'athlete');

        if ($activity->trashed()) {
            throw ValidationException::withMessages([
                'activity' => 'This activity has already been deleted.',
            ]);
        }

        if ($actor->isAthlete() && $activity->athlete_id !== $actor->id) {
            throw ValidationException::withMessages([
                'activity' => 'You cannot delete this activity.',
            ]);
        }

        $linkedSession = $activity->trainingSession;
        $linkedSessionDeleted = false;
        $athleteId = $activity->athlete_id;
        $sessionOwnerId = $linkedSession?->user_id;

        DB::transaction(function () use (
            $activity,
            $linkedSession,
            &$linkedSessionDeleted,
        ): void {
            if ($linkedSession instanceof TrainingSession) {
                $activity->training_session_id = null;
                $activity->save();
            }

            $activity->delete();

            if ($linkedSession instanceof TrainingSession) {
                $linkedSession->delete();
                $linkedSessionDeleted = true;
            }
        });

        $ownerId = $athleteId ?? $sessionOwnerId;

        if ($ownerId !== null) {
            $owner = User::query()->find($ownerId);

            if ($owner instanceof User && $owner->isAthlete()) {
                $this->dispatchRecentLoadRecalculation->execute($owner, 60);
            }
        }

        return [
            'linked_session_deleted' => $linkedSessionDeleted,
        ];
    }
}
