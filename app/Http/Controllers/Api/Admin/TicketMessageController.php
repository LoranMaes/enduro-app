<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TicketMessageStoreRequest;
use App\Http\Resources\TicketMessageResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TicketMessageController extends Controller
{
    public function __construct(
        private readonly SupportTicketService $supportTicketService,
    ) {}

    public function store(
        TicketMessageStoreRequest $request,
        Ticket $ticket,
    ): JsonResponse {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('replySupport', $ticket);

        $message = $this->supportTicketService->createMessage(
            $ticket,
            $admin,
            (string) $request->validated('body'),
        );

        return response()->json(
            (new TicketMessageResource($message))->resolve(),
            Response::HTTP_CREATED,
        );
    }
}
