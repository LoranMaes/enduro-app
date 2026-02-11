<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'uploaded_by_admin_id' => $this->uploaded_by_admin_id,
            'original_name' => $this->original_name,
            'display_name' => $this->display_name,
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'download_url' => "/api/admin/tickets/{$this->ticket_id}/attachments/{$this->id}",
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
