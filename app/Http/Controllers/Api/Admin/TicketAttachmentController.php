<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\TicketUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TicketAttachmentStoreRequest;
use App\Http\Resources\TicketAttachmentResource;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use App\Services\Tickets\TicketAuditLogger;
use App\Services\Uploads\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketAttachmentController extends Controller
{
    public function __construct(
        private readonly FileUploadService $fileUploadService,
        private readonly TicketAuditLogger $ticketAuditLogger,
    ) {}

    public function store(TicketAttachmentStoreRequest $request, Ticket $ticket): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('manageAttachment', $ticket);

        $uploadedFile = $request->file('file');
        abort_unless($uploadedFile !== null, 422);

        $disk = (string) config('tickets.attachments.disk', config('filesystems.default', 'local'));
        $storedFile = $this->fileUploadService->store(
            file: $uploadedFile,
            directory: "tickets/{$ticket->id}",
            disk: $disk,
        );

        $displayName = trim((string) ($request->validated('display_name') ?? ''));

        if ($displayName === '') {
            $displayName = (string) Str::of($storedFile['original_name'])
                ->replaceMatches('/\.[^.]+$/', '')
                ->limit(180, '')
                ->trim();
        }

        if ($displayName === '') {
            $displayName = 'Attachment';
        }

        $attachment = TicketAttachment::query()->create([
            'ticket_id' => $ticket->id,
            'uploaded_by_admin_id' => $admin->id,
            'original_name' => $storedFile['original_name'],
            'display_name' => $displayName,
            'extension' => $storedFile['extension'],
            'mime_type' => $storedFile['mime_type'],
            'size_bytes' => $storedFile['size_bytes'],
            'stored_disk' => $storedFile['disk'],
            'stored_path' => $storedFile['path'],
        ]);

        $this->ticketAuditLogger->log($ticket, $admin, 'attachment_added', [
            'attachment_id' => $attachment->id,
            'name' => $attachment->display_name,
        ]);

        TicketUpdated::dispatch($ticket->id, 'attachment_added', [
            'attachment_id' => $attachment->id,
        ]);

        return response()->json(
            (new TicketAttachmentResource($attachment))->resolve(),
            201,
        );
    }

    public function show(Request $request, Ticket $ticket, TicketAttachment $ticketAttachment): StreamedResponse
    {
        $this->authorize('view', $ticket);
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

    public function destroy(Request $request, Ticket $ticket, TicketAttachment $ticketAttachment): \Illuminate\Http\Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('manageAttachment', $ticket);
        abort_unless($ticketAttachment->ticket_id === $ticket->id, 404);

        $disk = Storage::disk($ticketAttachment->stored_disk);

        if ($disk->exists($ticketAttachment->stored_path)) {
            $disk->delete($ticketAttachment->stored_path);
        }

        $attachmentId = $ticketAttachment->id;
        $ticketAttachment->delete();

        $this->ticketAuditLogger->log($ticket, $admin, 'attachment_removed', [
            'attachment_id' => $attachmentId,
        ]);

        TicketUpdated::dispatch($ticket->id, 'attachment_removed', [
            'attachment_id' => $attachmentId,
        ]);

        return response()->noContent();
    }
}
