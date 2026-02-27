<?php

namespace App\Http\Controllers;

use App\Http\Resources\TicketResource;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Pennant\Feature;

class SupportPageController extends Controller
{
    public function __construct(
        private readonly SupportTicketService $supportTicketService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        abort_if($user->isAdmin(), 403);
        $hasSupportAccess = Feature::for($user)->active('support.tickets');
        $tickets = $hasSupportAccess
            ? $this->supportTicketService->listForUser($user)
            : $this->previewTickets($user);

        return Inertia::render('support/index', [
            'isLocked' => ! $hasSupportAccess,
            'initialTickets' => [
                'active' => $hasSupportAccess
                    ? TicketResource::collection($tickets['active'])->resolve()
                    : $tickets['active'],
                'archived' => $hasSupportAccess
                    ? TicketResource::collection($tickets['archived'])->resolve()
                    : $tickets['archived'],
            ],
            'statusLabels' => [
                'todo' => 'Submitted',
                'in_progress' => 'In progress',
                'to_review' => 'Reviewing',
                'done' => 'Resolved',
            ],
            'attachmentLimits' => [
                'max_file_size_kb' => max(1, (int) config('tickets.support.attachments.max_file_size_kb', 10240)),
                'max_files_per_ticket' => max(1, (int) config('tickets.support.attachments.max_files_per_ticket', 5)),
            ],
        ]);
    }

    /**
     * @return array{
     *     active: array<int, array<string, mixed>>,
     *     archived: array<int, array<string, mixed>>
     * }
     */
    private function previewTickets(User $user): array
    {
        $now = CarbonImmutable::now();
        $active = [
            $this->previewTicket(
                id: 'preview-bug-1',
                title: 'Sync duplicated one activity entry',
                type: 'bug',
                status: 'in_progress',
                hasAdminResponse: true,
                createdAt: $now->subDays(5),
                updatedAt: $now->subHours(4),
                reporterName: $user->fullName(),
                messages: [
                    [
                        'id' => 'preview-message-1',
                        'ticket_id' => 'preview-bug-1',
                        'body' => 'I noticed a duplicate workout card after sync.',
                        'author' => [
                            'id' => (string) $user->getRouteKey(),
                            'name' => $user->fullName(),
                            'role' => (string) $user->role?->value,
                        ],
                        'is_admin_author' => false,
                        'created_at' => $now->subDays(4)->toIso8601String(),
                        'updated_at' => $now->subDays(4)->toIso8601String(),
                    ],
                    [
                        'id' => 'preview-message-2',
                        'ticket_id' => 'preview-bug-1',
                        'body' => 'Thanks, we are currently investigating this in the calendar sync pipeline.',
                        'author' => [
                            'id' => 'preview-admin',
                            'name' => 'Support Team',
                            'role' => 'admin',
                        ],
                        'is_admin_author' => true,
                        'created_at' => $now->subDays(3)->toIso8601String(),
                        'updated_at' => $now->subDays(3)->toIso8601String(),
                    ],
                ],
            ),
            $this->previewTicket(
                id: 'preview-feature-2',
                title: 'Template search for workouts',
                type: 'feature',
                status: 'to_review',
                hasAdminResponse: false,
                createdAt: $now->subDays(2),
                updatedAt: $now->subDay(),
                reporterName: $user->fullName(),
            ),
        ];

        $archived = [
            $this->previewTicket(
                id: 'preview-resolved-3',
                title: 'Timezone selection in settings',
                type: 'support',
                status: 'done',
                hasAdminResponse: true,
                createdAt: $now->subDays(20),
                updatedAt: $now->subDays(14),
                reporterName: $user->fullName(),
                archivedAt: $now->subDays(13),
            ),
        ];

        return [
            'active' => $active,
            'archived' => $archived,
        ];
    }

    /**
     * @param  list<array{
     *     id: string,
     *     ticket_id: string,
     *     body: string,
     *     author: array{id: string, name: string, role: string}|null,
     *     is_admin_author: bool,
     *     created_at: string,
     *     updated_at: string
     * }>  $messages
     * @return array<string, mixed>
     */
    private function previewTicket(
        string $id,
        string $title,
        string $type,
        string $status,
        bool $hasAdminResponse,
        CarbonImmutable $createdAt,
        CarbonImmutable $updatedAt,
        string $reporterName,
        ?CarbonImmutable $archivedAt = null,
        array $messages = [],
    ): array {
        return [
            'id' => $id,
            'title' => $title,
            'description' => [['type' => 'rich_text', 'text' => $title]],
            'source' => 'user',
            'status' => $status,
            'type' => $type,
            'importance' => 'normal',
            'assignee_admin_id' => null,
            'creator_admin_id' => null,
            'reporter_user_id' => 'preview-user',
            'first_admin_response_at' => $hasAdminResponse
                ? $updatedAt->subHours(6)->toIso8601String()
                : null,
            'has_admin_response' => $hasAdminResponse,
            'done_at' => $status === 'done'
                ? $updatedAt->toIso8601String()
                : null,
            'archived_at' => $archivedAt?->toIso8601String(),
            'archive_deadline_at' => null,
            'archiving_in_seconds' => null,
            'creator_admin' => null,
            'assignee_admin' => null,
            'reporter_user' => [
                'id' => 'preview-user',
                'name' => $reporterName,
                'email' => null,
                'role' => 'athlete',
            ],
            'attachments' => [],
            'messages' => $messages,
            'updated_at' => $updatedAt->toIso8601String(),
            'created_at' => $createdAt->toIso8601String(),
        ];
    }
}
