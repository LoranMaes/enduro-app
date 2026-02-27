<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\TicketUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TicketInternalNoteUpsertRequest;
use App\Models\Ticket;
use App\Models\TicketInternalNote;
use App\Models\User;
use App\Services\Tickets\TicketAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketInternalNoteController extends Controller
{
    public function __construct(
        private readonly TicketAuditLogger $ticketAuditLogger,
    ) {}

    public function upsert(TicketInternalNoteUpsertRequest $request, Ticket $ticket): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('manageInternalNote', $ticket);

        $validated = $request->validated();

        $note = TicketInternalNote::query()->updateOrCreate(
            [
                'ticket_id' => $ticket->id,
                'admin_id' => $admin->id,
            ],
            [
                'content' => (string) $validated['content'],
            ],
        );

        $this->ticketAuditLogger->log($ticket, $admin, 'internal_note_updated', [
            'note_id' => $note->id,
        ]);

        TicketUpdated::dispatch($ticket->id, 'internal_note_updated', [
            'note_id' => $note->id,
        ]);

        return response()->json([
            'id' => $note->id,
            'content' => $note->content,
            'updated_at' => $note->updated_at?->toIso8601String(),
        ]);
    }

    public function destroy(Request $request, Ticket $ticket): \Illuminate\Http\Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('manageInternalNote', $ticket);

        $note = TicketInternalNote::query()
            ->where('ticket_id', $ticket->id)
            ->where('admin_id', $admin->id)
            ->first();

        if ($note !== null) {
            $noteId = $note->id;
            $note->delete();

            $this->ticketAuditLogger->log($ticket, $admin, 'internal_note_deleted', [
                'note_id' => $noteId,
            ]);

            TicketUpdated::dispatch($ticket->id, 'internal_note_deleted', [
                'note_id' => $noteId,
            ]);
        }

        return response()->noContent();
    }
}
