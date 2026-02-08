<?php

namespace App\Services\ActivityProviders\Exceptions;

class ActivityProviderInvalidTokenException extends ActivityProviderUnauthorizedException
{
    public function __construct(string $provider, string $message = 'Access token is invalid or expired.')
    {
        parent::__construct($provider, $message);
    }
}
