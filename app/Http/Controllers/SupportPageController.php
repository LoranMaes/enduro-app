<?php

namespace App\Http\Controllers;

use App\Http\Resources\TicketResource;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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

        $tickets = $this->supportTicketService->listForUser($user);

        return Inertia::render('support/index', [
            'initialTickets' => [
                'active' => TicketResource::collection($tickets['active'])->resolve(),
                'archived' => TicketResource::collection($tickets['archived'])->resolve(),
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
}
