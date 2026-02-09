<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachApplication;
use App\Models\User;
use App\Support\Admin\AdminUserPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminConsoleController extends Controller
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

        $totalUsers = User::query()->count();
        $activeAthletes = User::query()
            ->where('role', 'athlete')
            ->count();
        $activeCoaches = User::query()
            ->where('role', 'coach')
            ->count();
        $pendingCoachApplications = CoachApplication::query()
            ->where('status', 'pending')
            ->count();

        $recentUsers = User::query()
            ->select('id', 'name', 'email', 'role', 'email_verified_at')
            ->withCount('trainingPlans')
            ->with([
                'coachProfile:id,user_id,is_approved',
                'coachApplication:id,user_id,status',
            ])
            ->latest('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('admin/index', [
            'metrics' => [
                'total_users' => $totalUsers,
                'active_athletes' => $activeAthletes,
                'active_coaches' => $activeCoaches,
                'pending_coach_applications' => $pendingCoachApplications,
                'estimated_mrr' => null,
            ],
            'recentUsers' => $recentUsers
                ->map(fn (User $listedUser): array => $this->adminUserPresenter->toListItem($listedUser, $admin))
                ->values(),
            'coachApplicationsPreview' => CoachApplication::query()
                ->where('status', 'pending')
                ->with('user:id,name,first_name,last_name,email')
                ->orderByDesc('submitted_at')
                ->limit(3)
                ->get()
                ->map(fn (CoachApplication $application): array => [
                    'id' => $application->id,
                    'name' => $application->user?->fullName() ?? 'Unknown coach',
                    'email' => $application->user?->email,
                    'submitted_at' => $application->submitted_at?->toIso8601String(),
                ])->values(),
        ]);
    }
}
