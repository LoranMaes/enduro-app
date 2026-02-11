<?php

namespace App\Services\Tickets;

use App\Models\Ticket;
use App\Models\TicketAuditLog;
use App\Models\User;

class TicketAuditLogger
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public function log(Ticket $ticket, ?User $actor, string $eventType, array $meta = []): TicketAuditLog
    {
        return TicketAuditLog::query()->create([
            'ticket_id' => $ticket->id,
            'actor_admin_id' => $actor?->id,
            'event_type' => $eventType,
            'meta' => $meta,
        ]);
    }
}
