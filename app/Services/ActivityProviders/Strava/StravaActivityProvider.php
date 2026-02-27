<?php

namespace App\Services\ActivityProviders\Strava;

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Data\ExternalActivityStreamsDTO;
use App\Models\User;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\ActivityProviders\Contracts\ActivityStreamProvider;

class StravaActivityProvider implements ActivityProvider, ActivityStreamProvider
{
    private const PROVIDER = 'strava';

    public function __construct(
        private readonly StravaApiClient $client,
        private readonly StravaActivityMapper $mapper,
    ) {}

    public function provider(): string
    {
        return self::PROVIDER;
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function fetchActivities(User $user, array $options = []): ActivityCollection
    {
        $activityPayloads = $this->client->getActivities($user, $options);
        $activities = new ActivityCollection;

        foreach ($activityPayloads as $activityPayload) {
            $activities->push($this->mapper->mapActivity($activityPayload));
        }

        return $activities;
    }

    public function fetchActivity(User $user, string $externalId): ExternalActivityDTO
    {
        $payload = $this->client->getActivity($user, $externalId);

        return $this->mapper->mapActivity($payload);
    }

    /**
     * @param  list<string>  $streamKeys
     */
    public function fetchStreams(
        User $user,
        string $externalId,
        array $streamKeys = [],
    ): ExternalActivityStreamsDTO {
        $payload = $this->client->getStreams($user, $externalId, $streamKeys);

        return $this->mapper->mapStreams($externalId, $payload);
    }
}
