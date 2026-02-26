<?php

namespace App\Http\Resources;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TicketAttachment
 */
class TicketAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $ticket = $this->relationLoaded('ticket') ? $this->ticket : null;
        $ticketKey = $ticket?->getRouteKey() ?? $this->ticket_id;
        $attachmentKey = $this->resource->getRouteKey();
        $requestUser = $request->user();
        $uploadedByAdmin = $this->relationLoaded('uploadedByAdmin')
            ? $this->uploadedByAdmin
            : null;
        $uploadedByUser = $this->relationLoaded('uploadedByUser')
            ? $this->uploadedByUser
            : null;
        $canUseAdminDownload = $request->routeIs('admin.api.*');

        if (! $canUseAdminDownload) {
            $canUseAdminDownload = $requestUser instanceof User
                && $ticket instanceof Ticket
                && $requestUser->can('view', $ticket);
        }

        return [
            'id' => $this->resource->getRouteKey(),
            'ticket_id' => $ticketKey,
            'uploaded_by_admin_id' => $uploadedByAdmin?->getRouteKey() ?? $this->uploaded_by_admin_id,
            'uploaded_by_user_id' => $uploadedByUser?->getRouteKey() ?? $this->uploaded_by_user_id,
            'uploaded_by_admin' => $uploadedByAdmin === null
                ? null
                : [
                    'id' => $uploadedByAdmin->getRouteKey(),
                    'name' => $uploadedByAdmin->fullName(),
                    'role' => $uploadedByAdmin->role?->value ?? 'admin',
                ],
            'uploaded_by_user' => $uploadedByUser === null
                ? null
                : [
                    'id' => $uploadedByUser->getRouteKey(),
                    'name' => $uploadedByUser->fullName(),
                    'role' => $uploadedByUser->role?->value ?? 'athlete',
                ],
            'original_name' => $this->original_name,
            'display_name' => $this->display_name,
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'download_url' => route(
                $canUseAdminDownload
                    ? 'admin.api.tickets.attachments.show'
                    : 'support.tickets.attachments.show',
                [
                    'ticket' => $ticketKey,
                    'ticketAttachment' => $attachmentKey,
                ],
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
