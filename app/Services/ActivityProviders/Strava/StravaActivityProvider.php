<?php

namespace App\Services\ActivityProviders\Strava;

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class StravaActivityProvider implements ActivityProvider
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
}
