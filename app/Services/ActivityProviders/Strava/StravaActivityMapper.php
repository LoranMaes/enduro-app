<?php

namespace App\Services\ActivityProviders\Strava;

use App\Data\ExternalActivityDTO;
use App\Data\ExternalActivityStreamsDTO;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use Carbon\CarbonImmutable;
use Throwable;

class StravaActivityMapper
{
    private const PROVIDER = 'strava';

    /**
     * @param  array<string, mixed>  $payload
     */
    public function mapActivity(array $payload): ExternalActivityDTO
    {
        $externalId = $payload['id'] ?? null;
        $startedAtRaw = $payload['start_date'] ?? null;
        $durationRaw = $payload['elapsed_time'] ?? ($payload['moving_time'] ?? null);

        if (! is_scalar($externalId)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Activity payload is missing id.',
            );
        }

        if (! is_string($startedAtRaw) || trim($startedAtRaw) === '') {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                "Activity [{$externalId}] payload is missing start_date.",
            );
        }

        if (! is_numeric($durationRaw)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                "Activity [{$externalId}] payload is missing elapsed_time.",
            );
        }

        try {
            $startedAt = CarbonImmutable::parse($startedAtRaw);
        } catch (Throwable) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                "Activity [{$externalId}] has invalid start_date format.",
            );
        }

        $sportTypeRaw = $payload['sport_type'] ?? ($payload['type'] ?? null);

        return new ExternalActivityDTO(
            provider: self::PROVIDER,
            external_id: (string) $externalId,
            sport: $this->mapSportType($sportTypeRaw),
            started_at: $startedAt,
            duration_seconds: (int) $durationRaw,
            distance_meters: $this->toNullableFloat($payload['distance'] ?? null),
            elevation_gain_meters: $this->toNullableFloat($payload['total_elevation_gain'] ?? null),
            raw_payload: $payload,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function mapStreams(string $externalId, array $payload): ExternalActivityStreamsDTO
    {
        $streams = [];
        $availableStreams = [];

        foreach ($this->streamKeyMap() as $stravaKey => $normalizedKey) {
            $streamPayload = $payload[$stravaKey] ?? null;

            if (! is_array($streamPayload)) {
                continue;
            }

            $data = $streamPayload['data'] ?? null;

            if (! is_array($data) || $data === []) {
                continue;
            }

            /** @var array<int, mixed> $data */
            $streams[$normalizedKey] = array_values($data);
            $availableStreams[] = $normalizedKey;
        }

        return new ExternalActivityStreamsDTO(
            provider: self::PROVIDER,
            externalId: $externalId,
            streams: $streams,
            availableStreams: array_values(array_unique($availableStreams)),
            summaryPolyline: null,
        );
    }

    private function mapSportType(mixed $sportType): string
    {
        if (! is_string($sportType) || trim($sportType) === '') {
            return 'other';
        }

        return match (strtolower(trim($sportType))) {
            'run', 'trailrun', 'virtualrun' => 'run',
            'ride', 'virtualride', 'ebikeride', 'mountainbikeride', 'gravelride' => 'bike',
            'swim' => 'swim',
            'workout', 'weighttraining' => 'gym',
            default => 'other',
        };
    }

    private function toNullableFloat(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    /**
     * @return array<string, string>
     */
    private function streamKeyMap(): array
    {
        return [
            'time' => 'time',
            'latlng' => 'latlng',
            'distance' => 'distance',
            'altitude' => 'elevation',
            'velocity_smooth' => 'speed',
            'heartrate' => 'heart_rate',
            'cadence' => 'cadence',
            'watts' => 'power',
            'temp' => 'temperature',
            'moving' => 'moving',
            'grade_smooth' => 'grade',
            'left_right_balance' => 'power_balance_left_right',
        ];
    }
}
