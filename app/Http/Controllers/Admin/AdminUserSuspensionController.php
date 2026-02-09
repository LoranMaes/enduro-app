<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SuspendUserRequest;
use App\Http\Requests\Admin\UnsuspendUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class AdminUserSuspensionController extends Controller
{
    public function store(SuspendUserRequest $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be suspended.');
        abort_if($user->is($admin), 422, 'You cannot suspend your own account.');

        $user->forceFill([
            'suspended_at' => now(),
            'suspended_by_user_id' => $admin->id,
            'suspension_reason' => trim((string) $request->string('reason')),
        ])->save();

        return to_route('admin.users.show', ['user' => $user->id])
            ->with('status', 'User suspended successfully.');
    }

    public function destroy(UnsuspendUserRequest $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User && $admin->isAdmin(), 403);

        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be unsuspended through this flow.');

        $user->forceFill([
            'suspended_at' => null,
            'suspended_by_user_id' => null,
            'suspension_reason' => null,
        ])->save();

        return to_route('admin.users.show', ['user' => $user->id])
            ->with('status', 'User reactivated successfully.');
    }
}
