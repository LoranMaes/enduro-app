<?php

namespace App\Services\Activities;

use App\Models\Activity;
use App\Models\AthleteProfile;
use App\Models\TrainingSession;
use App\Models\User;

class TrainingSessionActualMetricsResolver
{
    public function resolveActualDurationMinutes(TrainingSession $trainingSession): ?int
    {
        if (
            $trainingSession->actual_duration_minutes !== null
            && $trainingSession->actual_duration_minutes > 0
        ) {
            return $trainingSession->actual_duration_minutes;
        }

        return $this->resolveActivityDurationMinutes(
            $this->resolveSessionActivity($trainingSession),
        );
    }

    public function resolveActualTss(
        TrainingSession $trainingSession,
        ?User $contextUser = null,
    ): ?int {
        if ($trainingSession->actual_tss !== null && $trainingSession->actual_tss >= 0) {
            return $trainingSession->actual_tss;
        }

        $activity = $this->resolveSessionActivity($trainingSession);

        if (! $activity instanceof Activity) {
            return null;
        }

        return $this->resolveActivityTss($activity, $contextUser);
    }

    public function resolveActivityDurationMinutes(?Activity $activity): ?int
    {
        if (! $activity instanceof Activity) {
            return null;
        }

        $durationSeconds = $activity->duration_seconds;

        if ($durationSeconds === null || $durationSeconds <= 0) {
            return null;
        }

        return max(1, (int) round($durationSeconds / 60));
    }

    public function resolveActivityTss(
        Activity $activity,
        ?User $contextUser = null,
    ): ?int {
        $rawPayload = $this->normalizePayload($activity->raw_payload);

        $payloadTss = $this->payloadInteger(
            $rawPayload,
            ['tss', 'suffer_score', 'relative_effort', 'training_load'],
        );

        if ($payloadTss !== null) {
            return $payloadTss;
        }

        $athlete = $this->resolveAthleteContext($activity, $contextUser);

        if ($athlete instanceof User) {
            $athlete->loadMissing('athleteProfile');
        }

        $powerEstimate = $this->estimatePowerBasedTss($activity, $athlete);

        if ($powerEstimate !== null) {
            return $powerEstimate;
        }

        return $this->estimateHeartRateBasedTss($activity, $athlete);
    }

    public function resolveActivityProviderTss(Activity $activity): ?int
    {
        $rawPayload = $this->normalizePayload($activity->raw_payload);

        return $this->payloadInteger($rawPayload, ['tss']);
    }

    private function resolveSessionActivity(TrainingSession $trainingSession): ?Activity
    {
        if ($trainingSession->relationLoaded('activity')) {
            return $trainingSession->activity;
        }

        return $trainingSession->activity()->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizePayload(mixed $rawPayload): array
    {
        if (! is_array($rawPayload)) {
            return [];
        }

        return $rawPayload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $keys
     */
    private function payloadInteger(array $payload, array $keys): ?int
    {
        foreach ($keys as $key) {
            if (! array_key_exists($key, $payload)) {
                continue;
            }

            $normalized = $this->normalizeNonNegativeInteger($payload[$key]);

            if ($normalized !== null) {
                return $normalized;
            }
        }

        return null;
    }

    private function normalizeNonNegativeInteger(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value >= 0 ? $value : null;
        }

        if (is_numeric($value)) {
            $normalized = (int) round((float) $value);

            return $normalized >= 0 ? $normalized : null;
        }

        return null;
    }

    private function resolveAthleteContext(
        Activity $activity,
        ?User $contextUser,
    ): ?User {
        if ($contextUser instanceof User && $contextUser->isAthlete()) {
            return $contextUser;
        }

        if ($activity->relationLoaded('athlete') && $activity->athlete instanceof User) {
            return $activity->athlete;
        }

        return null;
    }

    private function estimatePowerBasedTss(Activity $activity, ?User $athlete): ?int
    {
        $durationSeconds = $activity->duration_seconds;

        if ($durationSeconds === null || $durationSeconds <= 0) {
            return null;
        }

        $rawPayload = $this->normalizePayload($activity->raw_payload);
        $normalizedPower = $this->payloadFloat(
            $rawPayload,
            ['weighted_average_watts', 'normalized_watts', 'average_watts'],
        );

        if ($normalizedPower === null || $normalizedPower <= 0) {
            return null;
        }

        $athleteProfile = $athlete?->athleteProfile;
        $ftpWatts = $this->resolveFtpWatts($athleteProfile);

        if ($ftpWatts === null || $ftpWatts <= 0) {
            return null;
        }

        $intensityFactor = $normalizedPower / $ftpWatts;

        if ($intensityFactor <= 0) {
            return null;
        }

        $estimatedTss = ($durationSeconds * $normalizedPower * $intensityFactor)
            / ($ftpWatts * 3600)
            * 100;

        return $this->normalizeEstimate($estimatedTss);
    }

    private function estimateHeartRateBasedTss(Activity $activity, ?User $athlete): ?int
    {
        $durationSeconds = $activity->duration_seconds;

        if ($durationSeconds === null || $durationSeconds <= 0) {
            return null;
        }

        $athleteProfile = $athlete?->athleteProfile;
        $thresholdHeartRate = $this->resolveThresholdHeartRate($athleteProfile);

        if ($thresholdHeartRate === null || $thresholdHeartRate <= 0) {
            return null;
        }

        $rawPayload = $this->normalizePayload($activity->raw_payload);
        $averageHeartRate = $this->payloadFloat(
            $rawPayload,
            ['average_heartrate', 'average_heart_rate', 'average_hr'],
        );

        if ($averageHeartRate === null || $averageHeartRate <= 0) {
            return null;
        }

        $intensityFactor = $averageHeartRate / $thresholdHeartRate;

        if ($intensityFactor <= 0) {
            return null;
        }

        $estimatedTss = ($durationSeconds / 3600) * ($intensityFactor ** 2) * 100;

        return $this->normalizeEstimate($estimatedTss);
    }

    private function resolveFtpWatts(?AthleteProfile $athleteProfile): ?int
    {
        if (! $athleteProfile instanceof AthleteProfile) {
            return null;
        }

        $ftpWatts = $athleteProfile->ftp_watts;

        return is_int($ftpWatts) && $ftpWatts > 0 ? $ftpWatts : null;
    }

    private function resolveThresholdHeartRate(?AthleteProfile $athleteProfile): ?int
    {
        if (! $athleteProfile instanceof AthleteProfile) {
            return null;
        }

        if (
            is_int($athleteProfile->threshold_heart_rate_bpm)
            && $athleteProfile->threshold_heart_rate_bpm > 0
        ) {
            return $athleteProfile->threshold_heart_rate_bpm;
        }

        if (
            is_int($athleteProfile->max_heart_rate_bpm)
            && $athleteProfile->max_heart_rate_bpm > 0
        ) {
            return (int) round($athleteProfile->max_heart_rate_bpm * 0.9);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $keys
     */
    private function payloadFloat(array $payload, array $keys): ?float
    {
        foreach ($keys as $key) {
            if (! array_key_exists($key, $payload) || ! is_numeric($payload[$key])) {
                continue;
            }

            return (float) $payload[$key];
        }

        return null;
    }

    private function normalizeEstimate(float $value): ?int
    {
        if ($value < 0) {
            return null;
        }

        $normalized = (int) round($value);
        $normalized = min($normalized, 2000);

        return $normalized >= 0 ? $normalized : null;
    }
}
