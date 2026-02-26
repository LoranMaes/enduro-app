<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TicketMessage
 */
class TicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $author = $this->relationLoaded('authorUser')
            ? $this->authorUser
            : null;
        $isAdminAuthor = $author instanceof User && $author->isAdmin();

        return [
            'id' => $this->resource->getRouteKey(),
            'ticket_id' => $this->ticket?->getRouteKey() ?? $this->ticket_id,
            'body' => $this->body,
            'author' => $author === null
                ? null
                : [
                    'id' => $author->getRouteKey(),
                    'name' => $author->fullName(),
                    'role' => $author->role?->value ?? 'athlete',
                ],
            'is_admin_author' => $isAdminAuthor,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
