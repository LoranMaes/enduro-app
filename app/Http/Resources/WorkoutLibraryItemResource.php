<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutLibraryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'sport' => $this->sport,
            'structure_json' => $this->structure_json,
            'estimated_duration_minutes' => $this->estimated_duration_minutes,
            'estimated_tss' => $this->estimated_tss,
            'tags' => $this->tags ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
