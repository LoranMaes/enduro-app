<?php

namespace App\Data;

final readonly class ExternalActivityStreamsDTO
{
    /**
     * @param  array<string, array<int, mixed>>  $streams
     * @param  list<string>  $availableStreams
     */
    public function __construct(
        public string $provider,
        public string $externalId,
        public array $streams,
        public array $availableStreams,
        public ?string $summaryPolyline = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'external_id' => $this->externalId,
            'streams' => $this->streams,
            'available_streams' => $this->availableStreams,
            'summary_polyline' => $this->summaryPolyline,
        ];
    }
}
