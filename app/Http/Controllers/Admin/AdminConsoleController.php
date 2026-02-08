<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminConsoleController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin !== null && $admin->isAdmin(), 403);

        $totalUsers = User::query()->count();
        $activeAthletes = User::query()
            ->where('role', 'athlete')
            ->count();
        $activeCoaches = User::query()
            ->where('role', 'coach')
            ->count();

        $recentUsers = User::query()
            ->select('id', 'name', 'email', 'role', 'email_verified_at')
            ->withCount('trainingPlans')
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(fn (User $listedUser): array => $this->toUserListItem($listedUser, $admin))
            ->values();

        return Inertia::render('admin/index', [
            'metrics' => [
                'total_users' => $totalUsers,
                'active_athletes' => $activeAthletes,
                'active_coaches' => $activeCoaches,
                'estimated_mrr' => null,
            ],
            'recentUsers' => $recentUsers,
        ]);
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     email: string,
     *     role: string|null,
     *     status: string,
     *     plan_label: string,
     *     can_impersonate: bool,
     *     is_current: bool
     * }
     */
    private function toUserListItem(User $user, User $admin): array
    {
        $role = $user->role?->value ?? 'athlete';
        $planLabel = $user->training_plans_count > 0
            ? "{$user->training_plans_count} plan".($user->training_plans_count === 1 ? '' : 's')
            : '-';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $role,
            'status' => $user->email_verified_at !== null ? 'active' : 'pending',
            'plan_label' => $planLabel,
            'can_impersonate' => ! $user->isAdmin(),
            'is_current' => $user->is($admin),
        ];
    }
}
