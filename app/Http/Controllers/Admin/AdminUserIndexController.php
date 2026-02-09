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

        $users = User::query()
            ->select('id', 'name', 'email', 'role', 'email_verified_at')
            ->withCount('trainingPlans')
            ->with([
                'coachProfile:id,user_id,is_approved',
                'coachApplication:id,user_id,status',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => $this->adminUserPresenter->toListItem($user, $admin))
            ->values();

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }
}
