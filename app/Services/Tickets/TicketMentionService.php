<?php

namespace App\Services\Tickets;

use App\Events\AdminNotificationCreated;
use App\Models\Ticket;
use App\Models\TicketMention;
use App\Models\User;
use App\Notifications\TicketMentionedNotification;

class TicketMentionService
{
    /**
     * @param  list<int>  $mentionedAdminIds
     */
    public function syncDescriptionMentions(Ticket $ticket, User $mentionedBy, array $mentionedAdminIds): void
    {
        $normalizedIds = collect($mentionedAdminIds)
            ->map(static fn (mixed $id): int => (int) $id)
            ->filter(static fn (int $id): bool => $id > 0)
            ->unique()
            ->values();

        $validAdminIds = User::query()
            ->whereIn('id', $normalizedIds)
            ->where('role', 'admin')
            ->pluck('id')
            ->map(static fn (int $id): int => (int) $id)
            ->values();

        $existingMentions = $ticket->mentions()
            ->whereNull('ticket_comment_id')
            ->where('source', 'description')
            ->get();

        $existingMentionedIds = $existingMentions
            ->pluck('mentioned_admin_id')
            ->map(static fn (int $id): int => (int) $id)
            ->values();

        $toRemoveIds = $existingMentionedIds->diff($validAdminIds)->values();

        if ($toRemoveIds->isNotEmpty()) {
            $ticket->mentions()
                ->whereNull('ticket_comment_id')
                ->where('source', 'description')
                ->whereIn('mentioned_admin_id', $toRemoveIds)
                ->delete();
        }

        $toCreateIds = $validAdminIds->diff($existingMentionedIds)->values();

        if ($toCreateIds->isEmpty()) {
            return;
        }

        $admins = User::query()
            ->whereIn('id', $toCreateIds)
            ->where('role', 'admin')
            ->get();

        foreach ($admins as $admin) {
            $mention = TicketMention::query()->create([
                'ticket_id' => $ticket->id,
                'ticket_comment_id' => null,
                'mentioned_admin_id' => $admin->id,
                'mentioned_by_admin_id' => $mentionedBy->id,
                'source' => 'description',
            ]);

            $notification = new TicketMentionedNotification($ticket, $mentionedBy, $mention);
            $admin->notify($notification);

            $latestUnread = $admin->unreadNotifications()->latest('created_at')->first();

            if ($latestUnread !== null) {
                AdminNotificationCreated::dispatch($admin->id, [
                    'id' => $latestUnread->id,
                    'type' => $latestUnread->type,
                    'data' => $latestUnread->data,
                    'created_at' => $latestUnread->created_at?->toIso8601String(),
                    'read_at' => $latestUnread->read_at?->toIso8601String(),
                ], $admin->unreadNotifications()->count());
            }
        }
    }

    /**
     * @return list<int>
     */
    public function extractMentionIdsFromDescription(?array $description): array
    {
        if (! is_array($description)) {
            return [];
        }

        $mentions = collect($description)
            ->flatten(8)
            ->filter(static fn (mixed $value): bool => is_array($value))
            ->map(function (mixed $value): ?int {
                if (! is_array($value)) {
                    return null;
                }

                if (($value['type'] ?? null) !== 'admin_mention') {
                    return null;
                }

                $adminId = $value['admin_id'] ?? null;

                if (! is_numeric($adminId)) {
                    return null;
                }

                return (int) $adminId;
            })
            ->filter(static fn (?int $id): bool => $id !== null && $id > 0)
            ->unique()
            ->values()
            ->all();

        return $mentions;
    }
}
