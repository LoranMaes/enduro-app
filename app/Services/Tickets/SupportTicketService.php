<?php

namespace App\Services\Tickets;

use App\Enums\TicketImportance;
use App\Enums\TicketSource;
use App\Enums\TicketStatus;
use App\Events\TicketUpdated;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\Uploads\FileUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SupportTicketService
{
    public function __construct(
        private readonly TicketAuditLogger $ticketAuditLogger,
        private readonly FileUploadService $fileUploadService,
    ) {}

    /**
     * @return array{
     *     active: Collection<int, Ticket>,
     *     archived: Collection<int, Ticket>
     * }
     */
    public function listForUser(User $user): array
    {
        $query = $this->baseSupportTicketQuery($user);

        return [
            'active' => (clone $query)
                ->whereNull('archived_at')
                ->limit(200)
                ->get(),
            'archived' => (clone $query)
                ->whereNotNull('archived_at')
                ->limit(200)
                ->get(),
        ];
    }

    public function loadTicketForSupport(Ticket $ticket): Ticket
    {
        $ticket->load($this->supportRelations());

        return $ticket;
    }

    /**
     * @param  array{title: string, type: string, message: string}  $attributes
     */
    public function createSupportTicket(User $user, array $attributes): Ticket
    {
        $ticket = Ticket::query()->create([
            'title' => $attributes['title'],
            'description' => [
                [
                    'type' => 'rich_text',
                    'text' => $attributes['message'],
                    'html' => nl2br(e($attributes['message'])),
                    'mentions' => [],
                    'user_refs' => [],
                ],
            ],
            'source' => TicketSource::User->value,
            'status' => TicketStatus::Todo->value,
            'type' => $attributes['type'],
            'importance' => TicketImportance::Normal->value,
            'creator_admin_id' => null,
            'assignee_admin_id' => null,
            'reporter_user_id' => $user->id,
        ]);

        $this->createMessage($ticket, $user, $attributes['message']);

        $this->ticketAuditLogger->log($ticket, null, 'support_ticket_created', [
            'reporter_user_id' => $user->id,
            'type' => $ticket->type?->value,
        ]);

        TicketUpdated::dispatch($ticket->id, 'support_ticket_created', [
            'source' => $ticket->source?->value,
        ]);

        return $this->loadTicketForSupport($ticket);
    }

    public function createMessage(
        Ticket $ticket,
        User $author,
        string $body,
    ): TicketMessage {
        $this->ensureTicketAllowsFollowUp($ticket);

        $message = TicketMessage::query()->create([
            'ticket_id' => $ticket->id,
            'author_user_id' => $author->id,
            'body' => $body,
        ]);

        if ($author->isAdmin()) {
            if ($ticket->first_admin_response_at === null) {
                $ticket->first_admin_response_at = now();
            }

            $this->ticketAuditLogger->log($ticket, $author, 'support_admin_replied', [
                'message_id' => $message->id,
            ]);
        } else {
            $this->ticketAuditLogger->log($ticket, null, 'support_message_added', [
                'message_id' => $message->id,
                'author_user_id' => $author->id,
            ]);
        }

        $ticket->touch();
        $ticket->save();

        TicketUpdated::dispatch($ticket->id, 'support_message_added', [
            'message_id' => $message->id,
        ]);

        $message->load('authorUser:id,public_id,name,first_name,last_name,email,role');

        return $message;
    }

    public function createAttachment(
        Ticket $ticket,
        User $author,
        UploadedFile $file,
        ?string $displayName = null,
    ): TicketAttachment {
        $this->ensureTicketAllowsFollowUp($ticket);

        $disk = (string) config('tickets.attachments.disk', config('filesystems.default', 'local'));
        $storedFile = $this->fileUploadService->store(
            file: $file,
            directory: "tickets/{$ticket->id}",
            disk: $disk,
        );

        $resolvedDisplayName = trim((string) $displayName);

        if ($resolvedDisplayName === '') {
            $resolvedDisplayName = (string) Str::of($storedFile['original_name'])
                ->replaceMatches('/\.[^.]+$/', '')
                ->limit(180, '')
                ->trim();
        }

        if ($resolvedDisplayName === '') {
            $resolvedDisplayName = 'Attachment';
        }

        $attachment = TicketAttachment::query()->create([
            'ticket_id' => $ticket->id,
            'uploaded_by_admin_id' => $author->isAdmin() ? $author->id : null,
            'uploaded_by_user_id' => $author->isAdmin() ? null : $author->id,
            'original_name' => $storedFile['original_name'],
            'display_name' => $resolvedDisplayName,
            'extension' => $storedFile['extension'],
            'mime_type' => $storedFile['mime_type'],
            'size_bytes' => $storedFile['size_bytes'],
            'stored_disk' => $storedFile['disk'],
            'stored_path' => $storedFile['path'],
        ]);

        if ($author->isAdmin()) {
            $this->ticketAuditLogger->log($ticket, $author, 'support_attachment_added', [
                'attachment_id' => $attachment->id,
            ]);
        } else {
            $this->ticketAuditLogger->log($ticket, null, 'support_attachment_added', [
                'attachment_id' => $attachment->id,
                'author_user_id' => $author->id,
            ]);
        }

        $ticket->touch();

        TicketUpdated::dispatch($ticket->id, 'support_attachment_added', [
            'attachment_id' => $attachment->id,
        ]);

        $attachment->load([
            'ticket',
            'uploadedByAdmin:id,public_id,name,first_name,last_name,email,role',
            'uploadedByUser:id,public_id,name,first_name,last_name,email,role',
        ]);

        return $attachment;
    }

    private function ensureTicketAllowsFollowUp(Ticket $ticket): void
    {
        if (! $ticket->isDone()) {
            return;
        }

        throw ValidationException::withMessages([
            'ticket' => ['This ticket is resolved and no longer accepts new replies.'],
        ]);
    }

    private function baseSupportTicketQuery(User $user): \Illuminate\Database\Eloquent\Builder
    {
        return Ticket::query()
            ->where('source', TicketSource::User->value)
            ->where('reporter_user_id', $user->id)
            ->with($this->supportRelations())
            ->orderByDesc('updated_at')
            ->orderByDesc('id');
    }

    /**
     * @return array<int, string|array{string, \Closure(\Illuminate\Database\Eloquent\Builder): void}>
     */
    private function supportRelations(): array
    {
        return [
            'creatorAdmin:id,public_id,name,first_name,last_name,email,role',
            'assigneeAdmin:id,public_id,name,first_name,last_name,email,role',
            'reporterUser:id,public_id,name,first_name,last_name,email,role',
            'attachments' => function ($query): void {
                $query
                    ->with([
                        'uploadedByAdmin:id,public_id,name,first_name,last_name,email,role',
                        'uploadedByUser:id,public_id,name,first_name,last_name,email,role',
                    ])
                    ->latest('id')
                    ->limit(50);
            },
            'messages' => function ($query): void {
                $query
                    ->with('authorUser:id,public_id,name,first_name,last_name,email,role')
                    ->orderBy('id');
            },
        ];
    }
}
