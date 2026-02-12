<?php

namespace App\Services\ActivityProviders\Strava;

use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderTokenManager;
use App\Services\ActivityProviders\Exceptions\ActivityProviderInvalidTokenException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderTokenMissingException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class StravaApiClient
{
    private const PROVIDER = 'strava';

    public function __construct(
        private readonly ActivityProviderTokenManager $tokenManager,
    ) {}

    /**
     * @param  array<string, mixed>  $options
     * @return list<array<string, mixed>>
     */
    public function getActivities(User $user, array $options = []): array
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

        $activities = [];

        foreach ($payload as $activityPayload) {
            if (! is_array($activityPayload)) {
                continue;
            }

            $activities[] = $activityPayload;
        }

        return $activities;
    }

    /**
     * @return array<string, mixed>
     */
    public function getActivity(User $user, string $externalId): array
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

        return $payload;
    }

    /**
     * @param  list<string>  $streamKeys
     * @return array<string, mixed>
     */
    public function getStreams(User $user, string $externalId, array $streamKeys = []): array
    {
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

        return $payload;
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
