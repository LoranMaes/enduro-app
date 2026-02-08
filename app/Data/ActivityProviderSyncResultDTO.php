<?php

namespace App\Data;

use Carbon\CarbonImmutable;

final readonly class ActivityProviderSyncResultDTO
{
    public function __construct(
        public string $provider,
        public int $syncedActivitiesCount,
        public CarbonImmutable $syncedAt,
        public string $status,
        public ?string $failureReason = null,
    ) {}

    /**
     * @return array{
     *     provider: string,
     *     synced_activities_count: int,
     *     synced_at: string,
     *     status: string,
     *     failure_reason: string|null
     * }
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'synced_activities_count' => $this->syncedActivitiesCount,
            'synced_at' => $this->syncedAt->toIso8601String(),
            'status' => $this->status,
            'failure_reason' => $this->failureReason,
        ];
    }
}
