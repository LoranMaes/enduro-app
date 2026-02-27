<?php

namespace App\Jobs;

use App\Enums\TicketStatus;
use App\Events\TicketUpdated;
use App\Models\Ticket;
use App\Services\Tickets\TicketArchiveDelayResolver;
use App\Services\Tickets\TicketAuditLogger;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ArchiveDoneTicketsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(
        TicketArchiveDelayResolver $ticketArchiveDelayResolver,
        TicketAuditLogger $ticketAuditLogger,
    ): void {
        $delayHours = $ticketArchiveDelayResolver->resolveHours();
        $archiveBefore = now()->subHours($delayHours);

        Ticket::query()
            ->whereNull('archived_at')
            ->where('status', TicketStatus::Done->value)
            ->whereNotNull('done_at')
            ->where('done_at', '<=', $archiveBefore)
            ->chunkById(100, function ($tickets) use ($ticketAuditLogger): void {
                foreach ($tickets as $ticket) {
                    $ticket->archived_at = now();
                    $ticket->save();

                    $ticketAuditLogger->log($ticket, null, 'ticket_archived', [
                        'done_at' => $ticket->done_at?->toIso8601String(),
                        'archived_at' => $ticket->archived_at?->toIso8601String(),
                    ]);

                    TicketUpdated::dispatch($ticket->id, 'ticket_archived');
                }
            });
    }
}
