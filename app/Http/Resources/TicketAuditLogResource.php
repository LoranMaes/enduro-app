<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TicketAuditLog
 */
class TicketAuditLogResource extends JsonResource
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
            'ticket_id' => $this->ticket_id,
            'event_type' => $this->event_type,
            'actor_admin_id' => $this->actor_admin_id,
            'actor_admin' => $this->whenLoaded('actorAdmin', function (): ?array {
                if ($this->actorAdmin === null) {
                    return null;
                }

                return [
                    'id' => $this->actorAdmin->id,
                    'name' => $this->actorAdmin->fullName(),
                    'email' => $this->actorAdmin->email,
                ];
            }),
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
