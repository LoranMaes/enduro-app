<?php

namespace App\Support\Admin;

use App\Models\User;

class AdminUserPresenter
{
    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     email: string,
     *     role: string|null,
     *     status: string,
     *     plan_label: string,
     *     created_at: string|null,
     *     can_impersonate: bool,
     *     is_current: bool
     * }
     */
    public function toListItem(User $user, User $admin): array
    {
        $user->loadMissing([
            'coachProfile',
            'coachApplication',
        ]);

        $trainingPlansCount = (int) ($user->training_plans_count ?? $user->trainingPlans()->count());
        $planLabel = $trainingPlansCount > 0
            ? "{$trainingPlansCount} plan".($trainingPlansCount === 1 ? '' : 's')
            : '-';

        return [
            'id' => $user->id,
            'name' => $user->fullName(),
            'email' => $user->email,
            'role' => $user->role?->value ?? 'athlete',
            'status' => $this->status($user),
            'plan_label' => $planLabel,
            'created_at' => $user->created_at?->toIso8601String(),
            'can_impersonate' => $this->canImpersonate($user),
            'is_current' => $user->is($admin),
        ];
    }

    public function status(User $user): string
    {
        if ($user->isSuspended()) {
            return 'suspended';
        }

        if (! $user->isCoach()) {
            return 'active';
        }

        $user->loadMissing([
            'coachProfile',
            'coachApplication',
        ]);

        if ($user->coachProfile?->is_approved === true) {
            return 'active';
        }

        return $user->coachApplication?->status === 'rejected'
            ? 'rejected'
            : 'pending';
    }

    public function canImpersonate(User $user): bool
    {
        if ($user->isAdmin() || $user->isSuspended()) {
            return false;
        }

        if (! $user->isCoach()) {
            return true;
        }

        $user->loadMissing('coachProfile');

        return $user->coachProfile?->is_approved === true;
    }
}
