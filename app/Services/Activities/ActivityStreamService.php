<?php

namespace App\Services\Activities;

use App\Data\ExternalActivityStreamsDTO;
use App\Models\Activity;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderManager;
use Illuminate\Support\Facades\Cache;

class ActivityStreamService
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
    ) {}

    /**
     * @param  list<string>  $streamKeys
     */
    public function streamsForActivity(
        User $user,
        Activity $activity,
        array $streamKeys = [],
    ): ExternalActivityStreamsDTO {
        $provider = strtolower(trim((string) $activity->provider));
        $normalizedKeys = array_values(array_unique(array_filter(
            array_map(static fn (mixed $value): ?string => is_string($value) ? trim($value) : null, $streamKeys),
            static fn (?string $value): bool => $value !== null && $value !== '',
        )));

        $cacheKey = $this->cacheKey($user, $activity, $normalizedKeys);
        $cacheTtlSeconds = max(
            60,
            (int) config('services.activity_providers.stream_cache_seconds', 900),
        );

        /** @var ExternalActivityStreamsDTO $streamDto */
        $streamDto = Cache::remember(
            $cacheKey,
            now()->addSeconds($cacheTtlSeconds),
            function () use ($activity, $normalizedKeys, $provider, $user): ExternalActivityStreamsDTO {
                $streamProvider = $this->providerManager->streamProvider($provider);

                return $streamProvider->fetchStreams(
                    user: $user,
                    externalId: (string) $activity->external_id,
                    streamKeys: $normalizedKeys,
                );
            },
        );

        $summaryPolyline = $streamDto->summaryPolyline
            ?? $this->extractSummaryPolyline($activity);

        return new ExternalActivityStreamsDTO(
            provider: $streamDto->provider,
            externalId: $streamDto->externalId,
            streams: $streamDto->streams,
            availableStreams: $streamDto->availableStreams,
            summaryPolyline: $summaryPolyline,
        );
    }

    /**
     * @param  list<string>  $streamKeys
     */
    private function cacheKey(User $user, Activity $activity, array $streamKeys): string
    {
        $joinedKeys = $streamKeys === []
            ? 'default'
            : implode(',', $streamKeys);

        return implode(':', [
            'activity-streams',
            strtolower(trim((string) $activity->provider)),
            (string) $user->id,
            (string) $activity->id,
            $joinedKeys,
        ]);
    }

    private function extractSummaryPolyline(Activity $activity): ?string
    {
        $rawPayload = $activity->raw_payload;

        if (! is_array($rawPayload)) {
            return null;
        }

        $mapPayload = $rawPayload['map'] ?? null;

        if (! is_array($mapPayload)) {
            return null;
        }

        $summaryPolyline = $mapPayload['summary_polyline'] ?? null;

        if (! is_string($summaryPolyline) || trim($summaryPolyline) === '') {
            return null;
        }

        return trim($summaryPolyline);
    }
}
