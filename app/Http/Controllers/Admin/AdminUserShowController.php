<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Admin\AdminUserPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AdminUserShowController extends Controller
{
    public function __construct(
        private readonly AdminUserPresenter $adminUserPresenter,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, User $user): Response
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        $validated = $request->validate([
            'scope' => ['nullable', 'in:causer,subject,all'],
            'event' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $scope = (string) ($validated['scope'] ?? 'causer');
        $event = isset($validated['event']) && trim((string) $validated['event']) !== ''
            ? trim((string) $validated['event'])
            : null;
        $perPage = (int) ($validated['per_page'] ?? 25);

        $logsQuery = $this->buildLogsQuery($user, $scope)
            ->with('causer');

        if ($event !== null) {
            $logsQuery->where('event', $event);
        }

        $paginatedLogs = $logsQuery
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        $logs = [
            'data' => $paginatedLogs->getCollection()
                ->map(function (Activity $activity): array {
                    $properties = $activity->properties?->toArray() ?? [];
                    $changes = $activity->changes;

                    return [
                        'id' => $activity->id,
                        'log_name' => $activity->log_name,
                        'event' => $activity->event,
                        'description' => $activity->description,
                        'subject_type' => $activity->subject_type,
                        'subject_label' => $this->subjectLabel($activity->subject_type),
                        'subject_id' => $activity->subject_id,
                        'causer_id' => $activity->causer_id,
                        'causer_name' => $activity->causer instanceof User
                            ? $activity->causer->fullName()
                            : null,
                        'created_at' => $activity->created_at?->toIso8601String(),
                        'properties' => $properties,
                        'changes' => [
                            'old' => $changes['old'] ?? null,
                            'attributes' => $changes['attributes'] ?? null,
                        ],
                    ];
                })
                ->values()
                ->all(),
            'links' => $paginatedLogs->linkCollection()
                ->map(fn (array $link): array => [
                    'url' => $link['url'],
                    'label' => (string) $link['label'],
                    'active' => (bool) $link['active'],
                ])
                ->all(),
            'meta' => [
                'current_page' => $paginatedLogs->currentPage(),
                'from' => $paginatedLogs->firstItem(),
                'last_page' => $paginatedLogs->lastPage(),
                'path' => $paginatedLogs->path(),
                'per_page' => $paginatedLogs->perPage(),
                'to' => $paginatedLogs->lastItem(),
                'total' => $paginatedLogs->total(),
            ],
        ];

        $eventOptions = $this->buildLogsQuery($user, $scope)
            ->whereNotNull('event')
            ->select('event')
            ->distinct()
            ->orderBy('event')
            ->pluck('event')
            ->filter(fn (mixed $value): bool => is_string($value) && trim($value) !== '')
            ->values()
            ->all();

        $user->loadMissing([
            'coachProfile',
            'coachApplication',
        ]);

        return Inertia::render('admin/users/show', [
            'user' => $this->adminUserPresenter->toListItem($user, $admin),
            'filters' => [
                'scope' => $scope,
                'event' => $event,
                'per_page' => $perPage,
            ],
            'scopeOptions' => [
                ['value' => 'causer', 'label' => 'Performed By User'],
                ['value' => 'subject', 'label' => 'Targeting User'],
                ['value' => 'all', 'label' => 'All Related'],
            ],
            'eventOptions' => $eventOptions,
            'logs' => $logs,
        ]);
    }

    private function buildLogsQuery(User $user, string $scope): Builder
    {
        $query = Activity::query();

        if ($scope === 'subject') {
            return $query->where('subject_type', User::class)
                ->where('subject_id', $user->id);
        }

        if ($scope === 'all') {
            return $query->where(function (Builder $builder) use ($user): void {
                $builder
                    ->where(function (Builder $causerQuery) use ($user): void {
                        $causerQuery
                            ->where('causer_type', User::class)
                            ->where('causer_id', $user->id);
                    })
                    ->orWhere(function (Builder $subjectQuery) use ($user): void {
                        $subjectQuery
                            ->where('subject_type', User::class)
                            ->where('subject_id', $user->id);
                    });
            });
        }

        return $query
            ->where('causer_type', User::class)
            ->where('causer_id', $user->id);
    }

    private function subjectLabel(?string $subjectType): ?string
    {
        if (! is_string($subjectType) || trim($subjectType) === '') {
            return null;
        }

        return (string) Str::of($subjectType)
            ->afterLast('\\')
            ->snake()
            ->replace('_', ' ')
            ->title();
    }
}
