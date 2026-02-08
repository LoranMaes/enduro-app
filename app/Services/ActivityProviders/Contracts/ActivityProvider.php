<?php

namespace App\Services\ActivityProviders\Contracts;

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Models\User;

interface ActivityProvider
{
    public function provider(): string;

    /**
     * @param  array<string, mixed>  $options
     */
    public function fetchActivities(User $user, array $options = []): ActivityCollection;

    public function fetchActivity(User $user, string $externalId): ExternalActivityDTO;
}
