<?php

namespace App\Data;

use Carbon\CarbonImmutable;

final readonly class ExternalActivityDTO
{
    /**
     * @param  array<string, mixed>|null  $raw_payload
     */
    public function __construct(
        public string $provider,
        public string $external_id,
        public string $sport,
        public CarbonImmutable $started_at,
        public int $duration_seconds,
        public ?float $distance_meters = null,
        public ?float $elevation_gain_meters = null,
        public ?array $raw_payload = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'external_id' => $this->external_id,
            'sport' => $this->sport,
            'started_at' => $this->started_at->toIso8601String(),
            'duration_seconds' => $this->duration_seconds,
            'distance_meters' => $this->distance_meters,
            'elevation_gain_meters' => $this->elevation_gain_meters,
            'raw_payload' => $this->raw_payload,
        ];
    }
}
