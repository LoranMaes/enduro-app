<?php

namespace App\Http\Controllers\Api\Support;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\SupportTicketAttachmentStoreRequest;
use App\Http\Resources\TicketAttachmentResource;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupportTicketAttachmentController extends Controller
{
    public function __construct(
        private readonly SupportTicketService $supportTicketService,
    ) {}

    public function store(
        SupportTicketAttachmentStoreRequest $request,
        Ticket $ticket,
    ): JsonResponse {
        $author = $request->user();
        abort_unless($author instanceof User, 403);
        $file = $request->file('file');
        abort_unless($file !== null, 422);

        $this->authorize('createSupportAttachment', $ticket);

        $attachment = $this->supportTicketService->createAttachment(
            $ticket,
            $author,
            $file,
            $request->validated('display_name'),
        );

        return response()->json(
            (new TicketAttachmentResource($attachment))->resolve(),
            201,
        );
    }

    public function show(
        Request $request,
        Ticket $ticket,
        TicketAttachment $ticketAttachment,
    ): StreamedResponse {
        $this->authorize('viewSupport', $ticket);
        abort_unless($ticketAttachment->ticket_id === $ticket->id, 404);

        $disk = Storage::disk($ticketAttachment->stored_disk);
        abort_unless($disk->exists($ticketAttachment->stored_path), 404);

        $filename = $ticketAttachment->display_name;

        if ($ticketAttachment->extension !== null) {
            $filename .= '.'.$ticketAttachment->extension;
        }

        return $disk->response(
            $ticketAttachment->stored_path,
            $filename,
            ['Content-Disposition' => 'inline; filename="'.$filename.'"'],
        );
    }
}
