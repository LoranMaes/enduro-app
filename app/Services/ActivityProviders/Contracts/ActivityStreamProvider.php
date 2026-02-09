<?php

namespace App\Services\ActivityProviders\Contracts;

use App\Data\ExternalActivityStreamsDTO;
use App\Models\User;

interface ActivityStreamProvider
{
    /**
     * @param  list<string>  $streamKeys
     */
    public function fetchStreams(
        User $user,
        string $externalId,
        array $streamKeys = [],
    ): ExternalActivityStreamsDTO;
}
