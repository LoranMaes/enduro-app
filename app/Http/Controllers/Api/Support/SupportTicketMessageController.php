<?php

namespace App\Http\Controllers\Api\Support;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\SupportTicketMessageStoreRequest;
use App\Http\Resources\TicketMessageResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class SupportTicketMessageController extends Controller
{
    public function __construct(
        private readonly SupportTicketService $supportTicketService,
    ) {}

    public function store(
        SupportTicketMessageStoreRequest $request,
        Ticket $ticket,
    ): JsonResponse {
        $author = $request->user();
        abort_unless($author instanceof User, 403);

        $this->authorize('createSupportMessage', $ticket);

        $message = $this->supportTicketService->createMessage(
            $ticket,
            $author,
            (string) $request->validated('body'),
        );

        return response()->json(
            (new TicketMessageResource($message))->resolve(),
            Response::HTTP_CREATED,
        );
    }
}
