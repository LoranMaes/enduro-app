<?php

namespace App\Services\ActivityProviders\Exceptions;

use RuntimeException;

class ActivityProviderRequestException extends RuntimeException
{
    public function __construct(string $provider, string $message = 'Request failed.')
    {
        parent::__construct("Activity provider [{$provider}] request failed. {$message}");
    }
}
