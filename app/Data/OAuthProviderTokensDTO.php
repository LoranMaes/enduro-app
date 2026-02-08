<?php

namespace App\Data;

use Carbon\CarbonImmutable;

final readonly class OAuthProviderTokensDTO
{
    public function __construct(
        public string $accessToken,
        public ?string $refreshToken,
        public CarbonImmutable $expiresAt,
        public ?string $providerAthleteId = null,
    ) {}
}
