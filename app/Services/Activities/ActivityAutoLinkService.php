<?php

namespace App\Services\Activities;

use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;

class ActivityAutoLinkService
{
    public function autoLinkRecentActivities(
        User $athlete,
        ?string $provider = null,
        ?int $afterTimestamp = null,
    ): int {
        $query = Activity::query()
            ->where('athlete_id', $athlete->id)
            ->whereNull('training_session_id')
            ->whereNotNull('started_at')
            ->orderBy('started_at');

        if (is_string($provider) && trim($provider) !== '') {
            $query->where('provider', strtolower(trim($provider)));
        }

        if (is_int($afterTimestamp) && $afterTimestamp > 0) {
            $query->where(
                'started_at',
                '>=',
                CarbonImmutable::createFromTimestampUTC($afterTimestamp),
            );
        }

        /** @var Collection<int, Activity> $activities */
        $activities = $query->get();
        $linkedCount = 0;

        foreach ($activities as $activity) {
            if ($this->autoLinkSingleActivity($athlete, $activity)) {
                $linkedCount++;
            }
        }

        return $linkedCount;
    }

    public function autoLinkSingleActivity(User $athlete, Activity $activity): bool
    {
        if ($activity->athlete_id !== $athlete->id) {
            return false;
        }

        if ($activity->training_session_id !== null || $activity->started_at === null) {
            return false;
        }

        $activitySport = $this->normalizeSport($activity->sport);
        $activityDate = $activity->started_at->toDateString();
        $activityDurationMinutes = $this->activityDurationMinutes($activity);

        /** @var Collection<int, TrainingSession> $candidateSessions */
        $candidateSessions = TrainingSession::query()
            ->where('user_id', $athlete->id)
            ->whereDate('scheduled_date', $activityDate)
            ->where('sport', $activitySport)
            ->whereDoesntHave('activity')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get([
                'id',
                'duration_minutes',
            ]);

        if ($candidateSessions->isEmpty()) {
            return false;
        }

        $bestSession = $candidateSessions
            ->sortBy(function (TrainingSession $session) use ($activityDurationMinutes): int {
                return abs($session->duration_minutes - $activityDurationMinutes);
            })
            ->first();

        if (! $bestSession instanceof TrainingSession) {
            return false;
        }

        $durationDifference = abs(
            $bestSession->duration_minutes - $activityDurationMinutes,
        );
        $maximumAllowedDifference = max(
            20,
            (int) round($activityDurationMinutes * 0.5),
        );

        if ($durationDifference > $maximumAllowedDifference) {
            return false;
        }

        $activity->training_session_id = $bestSession->id;
        $activity->save();

        return true;
    }

    private function activityDurationMinutes(Activity $activity): int
    {
        if ($activity->duration_seconds === null || $activity->duration_seconds <= 0) {
            return 0;
        }

        return max(1, (int) round($activity->duration_seconds / 60));
    }

    private function normalizeSport(string $sport): string
    {
        $normalizedSport = strtolower(trim($sport));

        return match ($normalizedSport) {
            'swim', 'bike', 'run', 'gym', 'other' => $normalizedSport,
            'ride', 'cycling' => 'bike',
            'strength' => 'gym',
            default => 'other',
        };
    }
}
