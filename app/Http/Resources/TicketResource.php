<?php

namespace App\Http\Resources;

use App\Services\Tickets\TicketArchiveDelayResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Ticket
 */
class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $archiveDelayHours = app(TicketArchiveDelayResolver::class)->resolveHours();
        $archiveDeadline = $this->archiveDeadlineHours($archiveDelayHours);

        $internalNote = null;

        if ($this->relationLoaded('internalNotes')) {
            $internalNote = $this->internalNotes->first();
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status?->value,
            'type' => $this->type?->value,
            'importance' => $this->importance?->value,
            'assignee_admin_id' => $this->assignee_admin_id,
            'creator_admin_id' => $this->creator_admin_id,
            'done_at' => $this->done_at?->toIso8601String(),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'archive_deadline_at' => $archiveDeadline?->toIso8601String(),
            'archiving_in_seconds' => $archiveDeadline !== null
                ? max(0, now()->diffInSeconds($archiveDeadline, false))
                : null,
            'creator_admin' => $this->whenLoaded('creatorAdmin', function (): ?array {
                if ($this->creatorAdmin === null) {
                    return null;
                }

                return [
                    'id' => $this->creatorAdmin->id,
                    'name' => $this->creatorAdmin->fullName(),
                    'email' => $this->creatorAdmin->email,
                ];
            }),
            'assignee_admin' => $this->whenLoaded('assigneeAdmin', function (): ?array {
                if ($this->assigneeAdmin === null) {
                    return null;
                }

                return [
                    'id' => $this->assigneeAdmin->id,
                    'name' => $this->assigneeAdmin->fullName(),
                    'email' => $this->assigneeAdmin->email,
                ];
            }),
            'attachments' => TicketAttachmentResource::collection($this->whenLoaded('attachments')),
            'internal_note' => $internalNote === null
                ? null
                : [
                    'id' => $internalNote->id,
                    'content' => $internalNote->content,
                    'updated_at' => $internalNote->updated_at?->toIso8601String(),
                ],
            'mentions' => $this->whenLoaded('mentions', function (): array {
                return $this->mentions
                    ->map(function ($mention): array {
                        return [
                            'id' => $mention->id,
                            'mentioned_admin_id' => $mention->mentioned_admin_id,
                            'mentioned_by_admin_id' => $mention->mentioned_by_admin_id,
                            'source' => $mention->source,
                            'created_at' => $mention->created_at?->toIso8601String(),
                        ];
                    })
                    ->values()
                    ->all();
            }),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
