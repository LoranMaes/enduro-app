<?php

namespace App\Services\Performance;

use App\Models\AthleteProfile;

class AthletePerformanceProfileResolver
{
    /**
     * @return array{
     *     ftp_watts: int|null,
     *     lt1_power_watts: int|null,
     *     lt2_power_watts: int|null,
     *     max_heart_rate_bpm: int|null,
     *     lt1_heart_rate_bpm: int|null,
     *     lt2_heart_rate_bpm: int|null,
     *     threshold_heart_rate_bpm: int|null,
     *     threshold_pace_minutes_per_km: int|null,
     *     power_zones: array<int, array{label: string, min: int, max: int}>,
     *     heart_rate_zones: array<int, array{label: string, min: int, max: int}>
     * }
     */
    public function resolve(?AthleteProfile $athleteProfile): array
    {
        $ftpWatts = null;
        $lt1PowerWatts = null;
        $lt2PowerWatts = null;
        $maxHeartRate = null;
        $lt1HeartRate = null;
        $lt2HeartRate = null;
        $thresholdHeartRate = null;
        $thresholdPace = null;

        if ($athleteProfile instanceof AthleteProfile) {
            $ftpWatts = is_int($athleteProfile->ftp_watts) && $athleteProfile->ftp_watts > 0
                ? $athleteProfile->ftp_watts
                : null;
            $maxHeartRate = is_int($athleteProfile->max_heart_rate_bpm) && $athleteProfile->max_heart_rate_bpm > 0
                ? $athleteProfile->max_heart_rate_bpm
                : null;
            $lt1PowerWatts = is_int($athleteProfile->lt1_power_watts) && $athleteProfile->lt1_power_watts > 0
                ? $athleteProfile->lt1_power_watts
                : null;
            $lt2PowerWatts = is_int($athleteProfile->lt2_power_watts) && $athleteProfile->lt2_power_watts > 0
                ? $athleteProfile->lt2_power_watts
                : null;
            $lt1HeartRate = is_int($athleteProfile->lt1_heart_rate_bpm) && $athleteProfile->lt1_heart_rate_bpm > 0
                ? $athleteProfile->lt1_heart_rate_bpm
                : null;
            $lt2HeartRate = is_int($athleteProfile->lt2_heart_rate_bpm) && $athleteProfile->lt2_heart_rate_bpm > 0
                ? $athleteProfile->lt2_heart_rate_bpm
                : null;
            $thresholdHeartRate = is_int($athleteProfile->threshold_heart_rate_bpm)
                && $athleteProfile->threshold_heart_rate_bpm > 0
                    ? $athleteProfile->threshold_heart_rate_bpm
                    : null;
            $thresholdPace = is_int($athleteProfile->threshold_pace_minutes_per_km)
                && $athleteProfile->threshold_pace_minutes_per_km > 0
                    ? $athleteProfile->threshold_pace_minutes_per_km
                    : null;
        }

        if ($thresholdHeartRate === null && $maxHeartRate !== null) {
            $thresholdHeartRate = (int) round($maxHeartRate * 0.9);
        }

        return [
            'ftp_watts' => $ftpWatts,
            'lt1_power_watts' => $lt1PowerWatts,
            'lt2_power_watts' => $lt2PowerWatts,
            'max_heart_rate_bpm' => $maxHeartRate,
            'lt1_heart_rate_bpm' => $lt1HeartRate,
            'lt2_heart_rate_bpm' => $lt2HeartRate,
            'threshold_heart_rate_bpm' => $thresholdHeartRate,
            'threshold_pace_minutes_per_km' => $thresholdPace,
            'power_zones' => $this->normalizeZones(
                $athleteProfile?->power_zones,
                $this->defaultPowerZones(),
            ),
            'heart_rate_zones' => $this->normalizeZones(
                $athleteProfile?->heart_rate_zones,
                $this->defaultHeartRateZones(),
            ),
        ];
    }

    /**
     * @param  array<int, array{label: string, min: int, max: int}>  $defaults
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function normalizeZones(mixed $zones, array $defaults): array
    {
        if (! is_array($zones) || count($zones) !== count($defaults)) {
            return $defaults;
        }

        $normalized = [];

        foreach ($defaults as $index => $fallbackZone) {
            $zone = $zones[$index] ?? null;

            if (! is_array($zone)) {
                $normalized[] = $fallbackZone;

                continue;
            }

            $label = in_array(($zone['label'] ?? null), ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], true)
                ? (string) $zone['label']
                : $fallbackZone['label'];
            $min = is_numeric($zone['min'] ?? null)
                ? (int) $zone['min']
                : $fallbackZone['min'];
            $max = is_numeric($zone['max'] ?? null)
                ? (int) $zone['max']
                : $fallbackZone['max'];

            if ($max < $min) {
                $normalized[] = $fallbackZone;

                continue;
            }

            $normalized[] = [
                'label' => $label,
                'min' => $min,
                'max' => $max,
            ];
        }

        return $normalized;
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultPowerZones(): array
    {
        return [
            ['label' => 'Z1', 'min' => 55, 'max' => 75],
            ['label' => 'Z2', 'min' => 76, 'max' => 90],
            ['label' => 'Z3', 'min' => 91, 'max' => 105],
            ['label' => 'Z4', 'min' => 106, 'max' => 120],
            ['label' => 'Z5', 'min' => 121, 'max' => 150],
        ];
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultHeartRateZones(): array
    {
        return [
            ['label' => 'Z1', 'min' => 60, 'max' => 72],
            ['label' => 'Z2', 'min' => 73, 'max' => 82],
            ['label' => 'Z3', 'min' => 83, 'max' => 89],
            ['label' => 'Z4', 'min' => 90, 'max' => 95],
            ['label' => 'Z5', 'min' => 96, 'max' => 100],
        ];
    }
}
