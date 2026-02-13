<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'type' => $this->type?->value ?? $this->type,
            'sport' => $this->sport?->value ?? $this->sport,
            'title' => $this->title,
            'description' => $this->description,
            'target_date' => $this->target_date?->toDateString(),
            'priority' => $this->priority?->value ?? $this->priority,
            'status' => $this->status?->value ?? $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
