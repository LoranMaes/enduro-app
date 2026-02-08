<?php

namespace App\Services\ActivityProviders\Exceptions;

use RuntimeException;

class ActivityProviderTokenMissingException extends RuntimeException
{
    public function __construct(string $provider)
    {
        parent::__construct("Activity provider [{$provider}] access token is missing for this user.");
    }
}
