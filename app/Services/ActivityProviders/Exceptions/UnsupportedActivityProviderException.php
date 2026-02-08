<?php

namespace App\Services\ActivityProviders\Exceptions;

use InvalidArgumentException;

class UnsupportedActivityProviderException extends InvalidArgumentException
{
    /**
     * @param  list<string>  $allowedProviders
     */
    public function __construct(string $provider, array $allowedProviders = [])
    {
        $allowedList = implode(', ', $allowedProviders);
        $message = $allowedList === ''
            ? "Unsupported activity provider [{$provider}]."
            : "Unsupported activity provider [{$provider}]. Allowed providers: {$allowedList}.";

        parent::__construct($message);
    }
}
