<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminTicketBoardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:160'],
            'assignee_admin_id' => ['nullable', 'integer'],
            'creator_admin_id' => ['nullable', 'integer'],
            'type' => ['nullable', 'in:all,bug,feature,chore,support'],
            'importance' => ['nullable', 'in:all,low,normal,high,urgent'],
            'sort' => ['nullable', 'in:title,status,type,importance,created_at,updated_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'archived_page' => ['nullable', 'integer', 'min:1'],
            'archived_per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $filters = [
            'search' => trim((string) ($validated['search'] ?? '')),
            'assignee_admin_id' => (int) ($validated['assignee_admin_id'] ?? 0),
            'creator_admin_id' => (int) ($validated['creator_admin_id'] ?? 0),
            'type' => (string) ($validated['type'] ?? 'all'),
            'importance' => (string) ($validated['importance'] ?? 'all'),
            'sort' => (string) ($validated['sort'] ?? 'updated_at'),
            'direction' => (string) ($validated['direction'] ?? 'desc'),
        ];

        $boardQuery = $this->queryTickets($admin, $filters)
            ->whereNull('archived_at')
            ->orderBy($filters['sort'], $filters['direction']);

        $initialBoard = [];

        foreach (TicketStatus::cases() as $status) {
            $initialBoard[$status->value] = TicketResource::collection(
                (clone $boardQuery)
                    ->where('status', $status->value)
                    ->limit(150)
                    ->get(),
            )->resolve();
        }

        $archivedPerPage = (int) ($validated['archived_per_page'] ?? 25);

        $initialArchivedPaginator = $this->queryTickets($admin, $filters)
            ->whereNotNull('archived_at')
            ->orderBy($filters['sort'], $filters['direction'])
            ->paginate($archivedPerPage, ['*'], 'archived_page', (int) ($validated['archived_page'] ?? 1))
            ->withQueryString();

        $admins = User::query()
            ->select(['id', 'name', 'first_name', 'last_name', 'email'])
            ->where('role', 'admin')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->fullName(),
                'email' => $user->email,
            ])
            ->values()
            ->all();

        return Inertia::render('admin/tickets/index', [
            'initialBoard' => $initialBoard,
            'initialArchived' => [
                'data' => TicketResource::collection($initialArchivedPaginator->getCollection())->resolve(),
                'links' => $initialArchivedPaginator->linkCollection()->all(),
                'meta' => [
                    'current_page' => $initialArchivedPaginator->currentPage(),
                    'from' => $initialArchivedPaginator->firstItem(),
                    'last_page' => $initialArchivedPaginator->lastPage(),
                    'path' => $initialArchivedPaginator->path(),
                    'per_page' => $initialArchivedPaginator->perPage(),
                    'to' => $initialArchivedPaginator->lastItem(),
                    'total' => $initialArchivedPaginator->total(),
                ],
            ],
            'filters' => $filters,
            'admins' => $admins,
            'api' => [
                'boardIndex' => '/api/admin/tickets',
                'store' => '/api/admin/tickets',
                'notifications' => '/api/admin/ticket-notifications',
                'userSearch' => '/api/admin/ticket-user-search',
            ],
        ]);
    }

    /**
     * @param  array{
     *     search: string,
     *     assignee_admin_id: int,
     *     creator_admin_id: int,
     *     type: string,
     *     importance: string,
     *     sort: string,
     *     direction: string
     * }  $filters
     */
    private function queryTickets(User $admin, array $filters): Builder
    {
        return Ticket::query()
            ->with([
                'creatorAdmin:id,name,first_name,last_name,email',
                'assigneeAdmin:id,name,first_name,last_name,email',
                'attachments',
                'mentions',
                'internalNotes' => fn ($query) => $query->where('admin_id', $admin->id),
            ])
            ->when($filters['assignee_admin_id'] > 0, fn (Builder $query) => $query->where('assignee_admin_id', $filters['assignee_admin_id']))
            ->when($filters['creator_admin_id'] > 0, fn (Builder $query) => $query->where('creator_admin_id', $filters['creator_admin_id']))
            ->when($filters['type'] !== 'all', fn (Builder $query) => $query->where('type', $filters['type']))
            ->when($filters['importance'] !== 'all', fn (Builder $query) => $query->where('importance', $filters['importance']))
            ->when($filters['search'] !== '', function (Builder $query) use ($filters, $admin): void {
                $searchLike = '%'.$filters['search'].'%';

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
}
