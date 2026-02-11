<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\TicketStatus;
use App\Events\TicketUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TicketStoreRequest;
use App\Http\Requests\Admin\TicketUpdateRequest;
use App\Http\Resources\TicketAuditLogResource;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Tickets\TicketAuditLogger;
use App\Services\Tickets\TicketMentionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketAuditLogger $ticketAuditLogger,
        private readonly TicketMentionService $ticketMentionService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);
        $this->authorize('viewAny', Ticket::class);

        $validated = $request->validate([
            'view' => ['nullable', 'in:board,archived'],
            'search' => ['nullable', 'string', 'max:160'],
            'assignee_admin_id' => ['nullable', 'integer'],
            'creator_admin_id' => ['nullable', 'integer'],
            'type' => ['nullable', 'in:bug,feature,chore,support'],
            'importance' => ['nullable', 'in:low,normal,high,urgent'],
            'status' => ['nullable', 'in:todo,in_progress,to_review,done'],
            'sort' => ['nullable', 'in:title,status,type,importance,created_at,updated_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $view = (string) ($validated['view'] ?? 'board');
        $sort = (string) ($validated['sort'] ?? 'updated_at');
        $direction = (string) ($validated['direction'] ?? 'desc');

        if ($view === 'archived') {
            $perPage = (int) ($validated['per_page'] ?? 25);

            $paginator = $this->baseQuery($admin, $validated)
                ->whereNotNull('archived_at')
                ->orderBy($sort, $direction)
                ->paginate($perPage)
                ->withQueryString();

            return response()->json([
                'data' => TicketResource::collection($paginator->getCollection())->resolve(),
                'links' => $paginator->linkCollection()->all(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'from' => $paginator->firstItem(),
                    'last_page' => $paginator->lastPage(),
                    'path' => $paginator->path(),
                    'per_page' => $paginator->perPage(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
            ]);
        }

        $query = $this->baseQuery($admin, $validated)
            ->whereNull('archived_at')
            ->orderBy($sort, $direction);

        $statuses = [
            TicketStatus::Todo->value,
            TicketStatus::InProgress->value,
            TicketStatus::ToReview->value,
            TicketStatus::Done->value,
        ];

        $grouped = [];

        foreach ($statuses as $status) {
            $grouped[$status] = TicketResource::collection(
                (clone $query)
                    ->where('status', $status)
                    ->limit(200)
                    ->get(),
            )->resolve();
        }

        return response()->json([
            'data' => $grouped,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TicketStoreRequest $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);
        $this->authorize('create', Ticket::class);

        $validated = $request->validated();
        $status = (string) ($validated['status'] ?? TicketStatus::Todo->value);

        $ticket = Ticket::query()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $status,
            'type' => $validated['type'],
            'importance' => $validated['importance'],
            'assignee_admin_id' => $validated['assignee_admin_id'] ?? null,
            'creator_admin_id' => $admin->id,
            'done_at' => $status === TicketStatus::Done->value ? now() : null,
            'archived_at' => null,
        ]);

        $mentionIds = $this->resolveMentionIds($validated, $ticket);
        $this->ticketMentionService->syncDescriptionMentions($ticket, $admin, $mentionIds);

        $this->ticketAuditLogger->log($ticket, $admin, 'ticket_created', [
            'status' => $status,
            'type' => $ticket->type?->value,
            'importance' => $ticket->importance?->value,
            'assignee_admin_id' => $ticket->assignee_admin_id,
        ]);

        $ticket->load($this->ticketRelations($admin));

        TicketUpdated::dispatch($ticket->id, 'ticket_created', [
            'status' => $ticket->status?->value,
        ]);

        return response()->json((new TicketResource($ticket))->resolve(), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('view', $ticket);

        $relations = $this->ticketRelations($admin);
        $relations['auditLogs'] = function ($query): void {
            $query
                ->with('actorAdmin:id,name,first_name,last_name,email')
                ->latest('id')
                ->limit(50);
        };
        $ticket->load($relations);

        return new TicketResource($ticket);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TicketUpdateRequest $request, Ticket $ticket): TicketResource
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('update', $ticket);

        $validated = $request->validated();

        $before = $ticket->only([
            'title',
            'description',
            'status',
            'type',
            'importance',
            'assignee_admin_id',
            'done_at',
            'archived_at',
        ]);

        $ticket->fill([
            'title' => $validated['title'] ?? $ticket->title,
            'description' => $validated['description'] ?? $ticket->description,
            'status' => $validated['status'] ?? $ticket->status?->value,
            'type' => $validated['type'] ?? $ticket->type?->value,
            'importance' => $validated['importance'] ?? $ticket->importance?->value,
            'assignee_admin_id' => array_key_exists('assignee_admin_id', $validated)
                ? $validated['assignee_admin_id']
                : $ticket->assignee_admin_id,
        ]);

        if ($ticket->status?->value === TicketStatus::Done->value) {
            if ($ticket->done_at === null) {
                $ticket->done_at = now();
            }

            $ticket->archived_at = null;
        } else {
            $ticket->leaveDoneState();
        }

        $ticket->save();

        $after = $ticket->only([
            'title',
            'description',
            'status',
            'type',
            'importance',
            'assignee_admin_id',
            'done_at',
            'archived_at',
        ]);

        $changes = $this->resolveChanges($before, $after);

        if ($changes !== []) {
            $this->ticketAuditLogger->log($ticket, $admin, 'ticket_updated', [
                'changes' => $changes,
            ]);
        }

        $mentionIds = $this->resolveMentionIds($validated, $ticket);
        $this->ticketMentionService->syncDescriptionMentions($ticket, $admin, $mentionIds);

        $ticket->load($this->ticketRelations($admin));

        TicketUpdated::dispatch($ticket->id, 'ticket_updated', [
            'changes' => array_keys($changes),
        ]);

        return new TicketResource($ticket);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Ticket $ticket): \Illuminate\Http\Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 403);

        $this->authorize('delete', $ticket);

        $this->ticketAuditLogger->log($ticket, $admin, 'ticket_deleted', [
            'title' => $ticket->title,
        ]);

        $ticketId = $ticket->id;
        $ticket->delete();

        TicketUpdated::dispatch($ticketId, 'ticket_deleted');

        return response()->noContent();
    }

    public function auditLogs(Request $request, Ticket $ticket): AnonymousResourceCollection
    {
        $this->authorize('view', $ticket);

        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);

        $logs = $ticket->auditLogs()
            ->with('actorAdmin:id,name,first_name,last_name,email')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return TicketAuditLogResource::collection($logs);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function baseQuery(User $admin, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        return Ticket::query()
            ->with($this->ticketRelations($admin))
            ->when(isset($filters['assignee_admin_id']) && (int) $filters['assignee_admin_id'] > 0, function (Builder $query) use ($filters): void {
                $query->where('assignee_admin_id', (int) $filters['assignee_admin_id']);
            })
            ->when(isset($filters['creator_admin_id']) && (int) $filters['creator_admin_id'] > 0, function (Builder $query) use ($filters): void {
                $query->where('creator_admin_id', (int) $filters['creator_admin_id']);
            })
            ->when(isset($filters['type']) && (string) $filters['type'] !== '', function (Builder $query) use ($filters): void {
                $query->where('type', (string) $filters['type']);
            })
            ->when(isset($filters['importance']) && (string) $filters['importance'] !== '', function (Builder $query) use ($filters): void {
                $query->where('importance', (string) $filters['importance']);
            })
            ->when(isset($filters['status']) && (string) $filters['status'] !== '', function (Builder $query) use ($filters): void {
                $query->where('status', (string) $filters['status']);
            })
            ->when($search !== '', function (Builder $query) use ($search, $admin): void {
                $searchLike = "%{$search}%";

                $query->where(function (Builder $nestedQuery) use ($searchLike, $admin): void {
                    $nestedQuery
                        ->where('title', 'like', $searchLike)
                        ->orWhereRaw('CAST(description AS CHAR) LIKE ?', [$searchLike])
                        ->orWhereHas('internalNotes', function (Builder $internalNotesQuery) use ($searchLike, $admin): void {
                            $internalNotesQuery
                                ->where('admin_id', $admin->id)
                                ->where('content', 'like', $searchLike);
                        });
                });
            });
    }

    /**
     * @return array<int, string|array{string, \Closure(Builder): void}>
     */
    private function ticketRelations(User $admin): array
    {
        return [
            'creatorAdmin:id,name,first_name,last_name,email',
            'assigneeAdmin:id,name,first_name,last_name,email',
            'attachments',
            'mentions',
            'internalNotes' => function ($query) use ($admin): void {
                $query->where('admin_id', $admin->id);
            },
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<int>
     */
    private function resolveMentionIds(array $validated, Ticket $ticket): array
    {
        if (array_key_exists('mention_admin_ids', $validated)) {
            return collect((array) $validated['mention_admin_ids'])
                ->map(static fn (mixed $id): int => (int) $id)
                ->filter(static fn (int $id): bool => $id > 0)
                ->unique()
                ->values()
                ->all();
        }

        return $this->ticketMentionService->extractMentionIdsFromDescription(
            $ticket->description,
        );
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @return array<string, array{from: mixed, to: mixed}>
     */
    private function resolveChanges(array $before, array $after): array
    {
        $changes = [];

        foreach ($after as $key => $value) {
            $beforeValue = $before[$key] ?? null;

            if ($beforeValue === $value) {
                continue;
            }

            $changes[$key] = [
                'from' => $beforeValue,
                'to' => $value,
            ];
        }

        return $changes;
    }
}
