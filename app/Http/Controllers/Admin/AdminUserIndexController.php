<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Admin\AdminUserPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserIndexController extends Controller
{
    public function __construct(
        private readonly AdminUserPresenter $adminUserPresenter,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin !== null && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'in:all,athlete,coach,admin'],
            'status' => ['nullable', 'in:all,active,pending,rejected,suspended'],
            'sort' => ['nullable', 'in:name,email,role,status,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $role = (string) ($validated['role'] ?? 'all');
        $status = (string) ($validated['status'] ?? 'all');
        $sort = (string) ($validated['sort'] ?? 'created_at');
        $direction = (string) ($validated['direction'] ?? 'desc');
        $perPage = (int) ($validated['per_page'] ?? 25);

        $statusSql = $this->userStatusSql();

        $query = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'email_verified_at',
                'created_at',
                'suspended_at',
            ])
            ->withCount('trainingPlans')
            ->with([
                'coachProfile:id,user_id,is_approved',
                'coachApplication:id,user_id,status',
            ]);

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role === 'athlete') {
            $query->where(function ($builder): void {
                $builder->whereNull('role')
                    ->orWhere('role', 'athlete');
            });
        } elseif ($role !== 'all') {
            $query->where('role', $role);
        }

        if ($status !== 'all') {
            $query->whereRaw("{$statusSql} = ?", [$status]);
        }

        if ($sort === 'status') {
            $query->orderByRaw("{$statusSql} {$direction}");
            $query->orderBy('name');
        } else {
            $query->orderBy($sort, $direction);
        }

        $paginatedUsers = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => [
                'data' => $paginatedUsers->getCollection()
                    ->map(fn (User $user): array => $this->adminUserPresenter->toListItem($user, $admin))
                    ->values()
                    ->all(),
                'links' => $paginatedUsers->linkCollection()
                    ->map(fn (array $link): array => [
                        'url' => $link['url'],
                        'label' => (string) $link['label'],
                        'active' => (bool) $link['active'],
                    ])
                    ->all(),
                'meta' => [
                    'current_page' => $paginatedUsers->currentPage(),
                    'from' => $paginatedUsers->firstItem(),
                    'last_page' => $paginatedUsers->lastPage(),
                    'path' => $paginatedUsers->path(),
                    'per_page' => $paginatedUsers->perPage(),
                    'to' => $paginatedUsers->lastItem(),
                    'total' => $paginatedUsers->total(),
                ],
            ],
            'filters' => [
                'search' => $search,
                'role' => $role,
                'status' => $status,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'roleOptions' => [
                ['value' => 'all', 'label' => 'All roles'],
                ['value' => 'athlete', 'label' => 'Athletes'],
                ['value' => 'coach', 'label' => 'Coaches'],
                ['value' => 'admin', 'label' => 'Admins'],
            ],
            'statusOptions' => [
                ['value' => 'all', 'label' => 'All statuses'],
                ['value' => 'active', 'label' => 'Active'],
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'rejected', 'label' => 'Rejected'],
                ['value' => 'suspended', 'label' => 'Suspended'],
            ],
            'sortOptions' => [
                ['value' => 'created_at', 'label' => 'Created at'],
                ['value' => 'name', 'label' => 'Name'],
                ['value' => 'email', 'label' => 'Email'],
                ['value' => 'role', 'label' => 'Role'],
                ['value' => 'status', 'label' => 'Status'],
            ],
        ]);
    }

    private function userStatusSql(): string
    {
        return <<<'SQL'
CASE
    WHEN users.suspended_at IS NOT NULL THEN 'suspended'
    WHEN users.role IS NULL OR users.role <> 'coach' THEN 'active'
    WHEN EXISTS (
        SELECT 1
        FROM coach_profiles
        WHERE coach_profiles.user_id = users.id
            AND coach_profiles.is_approved = 1
    ) THEN 'active'
    WHEN EXISTS (
        SELECT 1
        FROM coach_applications
        WHERE coach_applications.user_id = users.id
            AND coach_applications.status = 'rejected'
    ) THEN 'rejected'
    ELSE 'pending'
END
SQL;
    }
}
