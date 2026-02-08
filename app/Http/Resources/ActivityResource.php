<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Activity
 */
class ActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'training_session_id' => $this->training_session_id,
            'athlete_id' => $this->athlete_id,
            'provider' => $this->provider,
            'external_id' => $this->external_id,
            'sport' => $this->sport,
            'started_at' => $this->started_at?->toISOString(),
            'duration_seconds' => $this->duration_seconds,
            'distance_meters' => $this->distance_meters,
            'elevation_gain_meters' => $this->elevation_gain_meters,
            'raw_payload' => $this->raw_payload,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
