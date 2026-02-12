<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;
use App\Policies\Concerns\DetectsImpersonation;

class TicketPolicy
{
    use DetectsImpersonation;

    public function before(User $user, string $ability): ?bool
    {
        if (! $user->isAdmin()) {
            return false;
        }

        if ($this->isImpersonating()) {
            return false;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function moveStatus(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function manageAttachment(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function manageInternalNote(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }
}
