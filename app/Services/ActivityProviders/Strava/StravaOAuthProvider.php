<?php

namespace App\Services\ActivityProviders\Strava;

use App\Data\OAuthProviderTokensDTO;
use App\Models\User;
use App\Services\ActivityProviders\Contracts\OAuthProvider;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StravaOAuthProvider implements OAuthProvider
{
    private const PROVIDER = 'strava';

    public function provider(): string
    {
        return self::PROVIDER;
    }

    public function authorizationUrl(User $user, string $state): string
    {
        $clientId = trim((string) config('services.strava.client_id'));
        $redirectUri = $this->resolveRedirectUri();

        if ($clientId === '') {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Client ID is missing from configuration.',
            );
        }

        $query = http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'approval_prompt' => 'auto',
            'scope' => implode(',', $this->resolveScopes()),
            'state' => $state,
        ]);

        return "{$this->oauthBaseUrl()}/oauth/authorize?{$query}";
    }

    public function exchangeAuthorizationCode(string $code): OAuthProviderTokensDTO
    {
        $response = $this->sendTokenRequest([
            'grant_type' => 'authorization_code',
            'code' => $code,
        ]);

        return $this->mapTokenResponse($response);
    }

    public function refreshAccessToken(string $refreshToken): OAuthProviderTokensDTO
    {
        $response = $this->sendTokenRequest([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]);

        return $this->mapTokenResponse($response);
    }

    /**
     * @param  array<string, string>  $payload
     */
    private function sendTokenRequest(array $payload): Response
    {
        $clientId = trim((string) config('services.strava.client_id'));
        $clientSecret = trim((string) config('services.strava.client_secret'));

        if ($clientId === '' || $clientSecret === '') {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Client credentials are missing from configuration.',
            );
        }

        $response = Http::asForm()
            ->acceptJson()
            ->timeout(15)
            ->post(
                "{$this->oauthBaseUrl()}/oauth/token",
                [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    ...$payload,
                ],
            );

        if ($response->status() === 429) {
            throw new ActivityProviderRateLimitedException(
                self::PROVIDER,
                $this->extractMessage($response, 'Retry later.'),
            );
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw new ActivityProviderUnauthorizedException(
                self::PROVIDER,
                $this->extractMessage($response, 'Unauthorized OAuth request.'),
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

    private function mapTokenResponse(Response $response): OAuthProviderTokensDTO
    {
        $accessToken = $response->json('access_token');
        $refreshToken = $response->json('refresh_token');
        $expiresAt = $response->json('expires_at');
        $athleteId = $response->json('athlete.id');

        if (! is_string($accessToken) || trim($accessToken) === '') {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Token response is missing access_token.',
            );
        }

        if (! is_numeric($expiresAt)) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Token response is missing expires_at.',
            );
        }

        try {
            $expiresAtDateTime = CarbonImmutable::createFromTimestampUTC(
                (int) $expiresAt,
            );
        } catch (RuntimeException) {
            throw new ActivityProviderRequestException(
                self::PROVIDER,
                'Token response contains invalid expires_at value.',
            );
        }

        return new OAuthProviderTokensDTO(
            accessToken: trim($accessToken),
            refreshToken: is_string($refreshToken) && trim($refreshToken) !== ''
                ? trim($refreshToken)
                : null,
            expiresAt: $expiresAtDateTime,
            providerAthleteId: is_scalar($athleteId) ? (string) $athleteId : null,
        );
    }

    private function resolveRedirectUri(): string
    {
        $configuredRedirectUri = trim((string) config('services.strava.redirect_uri'));

        if ($configuredRedirectUri !== '') {
            return $configuredRedirectUri;
        }

        return route('settings.connections.callback', ['provider' => self::PROVIDER]);
    }

    /**
     * @return list<string>
     */
    private function resolveScopes(): array
    {
        $scopes = array_values(array_filter(
            (array) config('services.strava.scopes', ['read', 'activity:read_all']),
            static fn (mixed $scope): bool => is_string($scope) && trim($scope) !== '',
        ));

        if ($scopes === []) {
            return ['read', 'activity:read_all'];
        }

        return $scopes;
    }

    private function oauthBaseUrl(): string
    {
        return rtrim(
            (string) config('services.strava.oauth_base_url', 'https://www.strava.com'),
            '/',
        );
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
