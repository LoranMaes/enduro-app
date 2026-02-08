<?php

namespace App\Services\ActivityProviders\Exceptions;

use RuntimeException;

class ActivityProviderRateLimitedException extends RuntimeException
{
    public function __construct(
        string $provider,
        string $message = 'Rate limit exceeded.',
        private readonly ?int $retryAfterSeconds = null,
    ) {
        $retryAfterMessage = $this->retryAfterSeconds !== null
            ? " Retry after {$this->retryAfterSeconds} seconds."
            : '';

        parent::__construct("Activity provider [{$provider}] rate limit exceeded. {$message}{$retryAfterMessage}");
    }

    public function retryAfterSeconds(): ?int
    {
        return $this->retryAfterSeconds;
    }
}
