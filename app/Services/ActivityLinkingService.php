<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use Illuminate\Database\Eloquent\Collection as ActivityCollection;

class ActivityLinkingService
{
    private const MAX_SUGGESTIONS = 5;

    public function suggestMatchesForSession(TrainingSession $session): ActivityCollection
    {
        $athleteId = $this->resolveAthleteId($session);

        if ($athleteId === null || $session->scheduled_date === null) {
            return new ActivityCollection;
        }

        $scheduledDate = $session->scheduled_date->toDateString();
        $normalizedSport = $this->normalizeSport($session->sport);
        $expectedDurationSeconds = max(0, $session->duration_minutes * 60);

        return Activity::query()
            ->where('athlete_id', $athleteId)
            ->where('sport', $normalizedSport)
            ->whereDate('started_at', $scheduledDate)
            ->whereNull('training_session_id')
            ->orderByRaw(
                'ABS(COALESCE(duration_seconds, 0) - ?) ASC',
                [$expectedDurationSeconds],
            )
            ->orderBy('started_at')
            ->limit(self::MAX_SUGGESTIONS)
            ->get();
    }

    private function resolveAthleteId(TrainingSession $session): ?int
    {
        if ($session->user_id !== null) {
            return $session->user_id;
        }

        $trainingWeek = $session->relationLoaded('trainingWeek')
            ? $session->trainingWeek
            : $session->trainingWeek()
                ->select('id', 'training_plan_id')
                ->first();

        if (! $trainingWeek instanceof TrainingWeek) {
            return null;
        }

        $trainingPlan = $trainingWeek->relationLoaded('trainingPlan')
            ? $trainingWeek->trainingPlan
            : $trainingWeek->trainingPlan()
                ->select('id', 'user_id')
                ->first();

        if ($trainingPlan === null) {
            return null;
        }

        return $trainingPlan->user_id;
    }

    private function normalizeSport(string $sport): string
    {
        return match (strtolower(trim($sport))) {
            'swim', 'bike', 'run', 'gym', 'other' => strtolower(trim($sport)),
            default => 'other',
        };
    }
}
