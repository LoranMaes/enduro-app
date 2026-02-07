<?php

namespace App\Http\Resources;

use App\Enums\TrainingSessionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TrainingSession
 */
class TrainingSessionResource extends JsonResource
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
            'training_week_id' => $this->training_week_id,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'sport' => $this->sport,
            'status' => $this->status instanceof TrainingSessionStatus ? $this->status->value : $this->status,
            'duration_minutes' => $this->duration_minutes,
            'planned_tss' => $this->planned_tss,
            'actual_tss' => $this->actual_tss,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
