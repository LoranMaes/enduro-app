<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TicketStatus;
use App\Events\TicketUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TicketMoveStatusRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Tickets\TicketAuditLogger;

class TicketStatusController extends Controller
{
    public function __construct(
        private readonly TicketAuditLogger $ticketAuditLogger,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(TicketMoveStatusRequest $request, Ticket $ticket): TicketResource
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('moveStatus', $ticket);

        $validated = $request->validated();
        $previousStatus = $ticket->status?->value;
        $nextStatus = (string) $validated['status'];

        if ($previousStatus === $nextStatus) {
            $ticket->load([
                'creatorAdmin:id,name,first_name,last_name,email',
                'assigneeAdmin:id,name,first_name,last_name,email',
                'attachments',
                'mentions',
                'internalNotes' => fn ($query) => $query->where('admin_id', $admin->id),
            ]);

            return new TicketResource($ticket);
        }

        $ticket->status = $nextStatus;

        if ($nextStatus === TicketStatus::Done->value) {
            if ($ticket->done_at === null) {
                $ticket->done_at = now();
            }

            $ticket->archived_at = null;
        } else {
            $ticket->leaveDoneState();
        }

        $ticket->save();

        $this->ticketAuditLogger->log($ticket, $admin, 'status_changed', [
            'from' => $previousStatus,
            'to' => $nextStatus,
        ]);

        TicketUpdated::dispatch($ticket->id, 'status_changed', [
            'from' => $previousStatus,
            'to' => $nextStatus,
        ]);

        $ticket->load([
            'creatorAdmin:id,name,first_name,last_name,email',
            'assigneeAdmin:id,name,first_name,last_name,email',
            'attachments',
            'mentions',
            'internalNotes' => fn ($query) => $query->where('admin_id', $admin->id),
        ]);

        return new TicketResource($ticket);
    }
}
