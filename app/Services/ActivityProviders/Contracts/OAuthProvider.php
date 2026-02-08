<?php

namespace App\Services\ActivityProviders\Contracts;

use App\Data\OAuthProviderTokensDTO;
use App\Models\User;

interface OAuthProvider
{
    public function provider(): string;

    public function authorizationUrl(User $user, string $state): string;

    public function exchangeAuthorizationCode(string $code): OAuthProviderTokensDTO;

    public function refreshAccessToken(string $refreshToken): OAuthProviderTokensDTO;
}
