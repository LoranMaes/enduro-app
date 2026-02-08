<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserIndexController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $admin = $request->user();
        abort_unless($admin !== null && $admin->isAdmin(), 403);

        $users = User::query()
            ->select('id', 'name', 'email', 'role', 'email_verified_at')
            ->withCount('trainingPlans')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) use ($admin): array {
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
            })
            ->values();

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }
}
