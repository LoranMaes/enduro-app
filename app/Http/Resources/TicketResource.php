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
            'id' => $this->resource->getRouteKey(),
            'title' => $this->title,
            'description' => $this->description,
            'source' => $this->source?->value ?? null,
            'status' => $this->status?->value,
            'type' => $this->type?->value,
            'importance' => $this->importance?->value,
            'assignee_admin_id' => $this->assigneeAdmin?->getRouteKey() ?? $this->assignee_admin_id,
            'creator_admin_id' => $this->creatorAdmin?->getRouteKey() ?? $this->creator_admin_id,
            'reporter_user_id' => $this->reporterUser?->getRouteKey() ?? $this->reporter_user_id,
            'first_admin_response_at' => $this->first_admin_response_at?->toIso8601String(),
            'has_admin_response' => $this->first_admin_response_at !== null,
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
                    'id' => $this->creatorAdmin->getRouteKey(),
                    'name' => $this->creatorAdmin->fullName(),
                    'email' => $this->creatorAdmin->email,
                ];
            }),
            'assignee_admin' => $this->whenLoaded('assigneeAdmin', function (): ?array {
                if ($this->assigneeAdmin === null) {
                    return null;
                }

                return [
                    'id' => $this->assigneeAdmin->getRouteKey(),
                    'name' => $this->assigneeAdmin->fullName(),
                    'email' => $this->assigneeAdmin->email,
                ];
            }),
            'reporter_user' => $this->whenLoaded('reporterUser', function (): ?array {
                if ($this->reporterUser === null) {
                    return null;
                }

                return [
                    'id' => $this->reporterUser->getRouteKey(),
                    'name' => $this->reporterUser->fullName(),
                    'email' => $this->reporterUser->email,
                    'role' => $this->reporterUser->role?->value ?? 'athlete',
                ];
            }),
            'attachments' => $this->resolveAttachments($request),
            'messages' => $this->resolveMessages($request),
            'internal_note' => $internalNote === null
                ? null
                : [
                    'id' => $internalNote->getRouteKey(),
                    'content' => $internalNote->content,
                    'updated_at' => $internalNote->updated_at?->toIso8601String(),
                ],
            'mentions' => $this->whenLoaded('mentions', function (): array {
                return $this->mentions
                    ->map(function ($mention): array {
                        return [
                            'id' => $mention->getRouteKey(),
                            'mentioned_admin_id' => $mention->mentionedAdmin?->getRouteKey() ?? $mention->mentioned_admin_id,
                            'mentioned_by_admin_id' => $mention->mentionedByAdmin?->getRouteKey() ?? $mention->mentioned_by_admin_id,
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

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolveAttachments(Request $request): array
    {
        if (! $this->relationLoaded('attachments')) {
            return [];
        }

        return $this->attachments
            ->map(
                static fn ($attachment): array => (new TicketAttachmentResource($attachment))->toArray($request),
            )
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolveMessages(Request $request): array
    {
        if (! $this->relationLoaded('messages')) {
            return [];
        }

        return $this->messages
            ->map(
                static fn ($message): array => (new TicketMessageResource($message))->toArray($request),
            )
            ->values()
            ->all();
    }
}
