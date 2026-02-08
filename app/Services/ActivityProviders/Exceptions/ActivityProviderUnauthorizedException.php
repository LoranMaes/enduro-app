<?php

namespace App\Services\ActivityProviders\Exceptions;

use RuntimeException;

class ActivityProviderUnauthorizedException extends RuntimeException
{
    public function __construct(string $provider, string $message = 'Unauthorized.')
    {
        parent::__construct("Activity provider [{$provider}] request unauthorized. {$message}");
    }
}
