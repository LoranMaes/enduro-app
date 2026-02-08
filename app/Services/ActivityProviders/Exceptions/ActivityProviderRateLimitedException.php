<?php

namespace App\Services\ActivityProviders\Exceptions;

use RuntimeException;

class ActivityProviderRateLimitedException extends RuntimeException
{
    public function __construct(string $provider, string $message = 'Rate limit exceeded.')
    {
        parent::__construct("Activity provider [{$provider}] rate limit exceeded. {$message}");
    }
}
