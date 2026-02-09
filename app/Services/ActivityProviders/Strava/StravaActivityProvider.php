<?php

namespace App\Services\ActivityProviders\Strava;

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Data\ExternalActivityStreamsDTO;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Contracts\ActivityStreamProvider;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class StravaActivityProvider implements ActivityProvider, ActivityStreamProvider
{
    private const PROVIDER = 'strava';

    public function __construct(
        private readonly ActivityProviderTokenManager $tokenManager,
    ) {}

    public function provider(): string
    {
        return self::PROVIDER;
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function fetchActivities(User $user, array $options = []): ActivityCollection
    {
        $response = $this->sendRequest(
            user: $user,
            method: 'GET',
            endpoint: '/athlete/activities',
            options: [
                'query' => $this->normalizeActivityQueryOptions($options),
            ],
        );

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Unexpected activities payload shape.',
            );
        }

        $activities = new ActivityCollection;

        foreach ($payload as $activityPayload) {
            if (! is_array($activityPayload)) {
                continue;
            }

            $activities->push($this->mapPayloadToDto($activityPayload));
        }

        return $activities;
    }

    public function fetchActivity(User $user, string $externalId): ExternalActivityDTO
    {
        $response = $this->sendRequest(
            user: $user,
            method: 'GET',
            endpoint: "/activities/{$externalId}",
        );

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Unexpected activity payload shape.',
            );
        }

        return $this->mapPayloadToDto($payload);
    }

    /**
     * @param  list<string>  $streamKeys
     */
    public function fetchStreams(
        User $user,
        string $externalId,
        array $streamKeys = [],
    ): ExternalActivityStreamsDTO {
        $normalizedKeys = $this->normalizeStreamKeys($streamKeys);
        $requestedKeys = $normalizedKeys === []
            ? $this->defaultStreamKeys()
            : $normalizedKeys;

        $response = $this->sendRequest(
            user: $user,
            method: 'GET',
            endpoint: "/activities/{$externalId}/streams",
            options: [
                'query' => [
                    'keys' => implode(',', $requestedKeys),
                    'key_by_type' => true,
                ],
            ],
        );

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Unexpected activity stream payload shape.',
            );
        }

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

    /**
     * @param  array<string, mixed>  $options
     */
    private function sendRequest(
        User $user,
        string $method,
        string $endpoint,
        array $options = [],
    ): Response {
        $response = Http::baseUrl((string) config('services.strava.base_url'))
            ->acceptJson()
            ->withToken($this->resolveAccessToken($user))
            ->timeout(15)
            ->send($method, $endpoint, $options);

        if ($response->status() === 429) {
            throw new ActivityProviderRateLimitedException(
                self::PROVIDER,
                $this->extractMessage($response, 'Retry later.'),
                $this->retryAfterSeconds($response),
            );
        }

        if ($response->status() === 401) {
            throw new ActivityProviderInvalidTokenException(
                self::PROVIDER,
                $this->extractMessage(
                    $response,
                    'Access token is invalid or expired.',
                ),
            );
        }

        if ($response->status() === 403) {
            throw new ActivityProviderUnauthorizedException(
                self::PROVIDER,
                $this->extractMessage($response, 'Forbidden.'),
            );
        }

        if ($response->failed()) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                $this->extractMessage(
                    $response,
                    "HTTP {$response->status()} returned by provider.",
                ),
            );
        }

        return $response;
    }

    private function resolveAccessToken(User $user): string
    {
        $token = trim((string) $this->tokenManager->validAccessToken(
            user: $user,
            provider: self::PROVIDER,
        ));

        if ($token === '') {
            throw new ActivityProviderTokenMissingException(self::PROVIDER);
        }

        return $token;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function mapPayloadToDto(array $payload): ExternalActivityDTO
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
        } catch (Throwable $throwable) {
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

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, scalar>
     */
    private function normalizeActivityQueryOptions(array $options): array
    {
        $normalized = [];

        foreach (['before', 'after', 'page', 'per_page'] as $key) {
            if (! array_key_exists($key, $options) || $options[$key] === null) {
                continue;
            }

            if (in_array($key, ['page', 'per_page'], true)) {
                $normalized[$key] = (int) $options[$key];

                continue;
            }

            $normalized[$key] = is_numeric($options[$key])
                ? (int) $options[$key]
                : (string) $options[$key];
        }

        return $normalized;
    }

    private function toNullableFloat(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    private function extractMessage(Response $response, string $default): string
    {
        $message = $response->json('message');

        if (is_string($message) && trim($message) !== '') {
            return $message;
        }

        return $default;
    }

    private function retryAfterSeconds(Response $response): ?int
    {
        $retryAfter = $response->header('Retry-After');

        if (! is_string($retryAfter)) {
            return null;
        }

        $retryAfter = trim($retryAfter);

        if (! ctype_digit($retryAfter)) {
            return null;
        }

        return (int) $retryAfter;
    }

    /**
     * @param  list<string>  $streamKeys
     * @return list<string>
     */
    private function normalizeStreamKeys(array $streamKeys): array
    {
        $lookup = array_flip($this->streamKeyMap());
        $normalized = [];

        foreach ($streamKeys as $key) {
            $normalizedKey = strtolower(trim($key));

            if ($normalizedKey === '') {
                continue;
            }

            if (array_key_exists($normalizedKey, $lookup)) {
                $normalized[] = $lookup[$normalizedKey];
            }
        }

        return array_values(array_unique($normalized));
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

    /**
     * @return list<string>
     */
    private function defaultStreamKeys(): array
    {
        return array_keys($this->streamKeyMap());
    }
}
