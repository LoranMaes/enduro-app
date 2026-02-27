<?php

namespace App\Http\Controllers\Api\Support;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\SupportTicketStoreRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Tickets\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Pennant\Feature;
use Symfony\Component\HttpFoundation\Response;

class SupportTicketController extends Controller
{
    public function __construct(
        private readonly SupportTicketService $supportTicketService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->ensureSupportAccess($user);

        $this->authorize('viewSupportAny', Ticket::class);

        $tickets = $this->supportTicketService->listForUser($user);

        return response()->json([
            'active' => TicketResource::collection($tickets['active'])->resolve(),
            'archived' => TicketResource::collection($tickets['archived'])->resolve(),
        ]);
    }

    public function store(SupportTicketStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->ensureSupportAccess($user);

        $this->authorize('createSupport', Ticket::class);

        $ticket = $this->supportTicketService->createSupportTicket(
            $user,
            $request->validated(),
        );

        return response()->json(
            (new TicketResource($ticket))->resolve(),
            Response::HTTP_CREATED,
        );
    }

    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->ensureSupportAccess($user);
        $this->authorize('viewSupport', $ticket);

        return new TicketResource(
            $this->supportTicketService->loadTicketForSupport($ticket),
        );
    }

    private function ensureSupportAccess(User $user): void
    {
        abort_unless(
            Feature::for($user)->active('support.tickets'),
            Response::HTTP_FORBIDDEN,
            'Support requires an active subscription.',
        );
    }
}
