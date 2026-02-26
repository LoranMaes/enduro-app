<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;
use App\Policies\Concerns\DetectsImpersonation;

class TicketPolicy
{
    use DetectsImpersonation;

    public function viewAny(User $user): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function create(User $user): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function moveStatus(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function manageAttachment(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function manageInternalNote(User $user, Ticket $ticket): bool
    {
        return $this->canAccessAdminBoard($user);
    }

    public function viewSupportAny(User $user): bool
    {
        return $this->canAccessSupportContext($user);
    }

    public function createSupport(User $user): bool
    {
        return $this->canAccessSupportContext($user);
    }

    public function viewSupport(User $user, Ticket $ticket): bool
    {
        if (! $this->canAccessSupportContext($user)) {
            return false;
        }

        return $this->isOwnedSupportTicket($user, $ticket);
    }

    public function createSupportMessage(User $user, Ticket $ticket): bool
    {
        if (! $this->canAccessSupportContext($user)) {
            return false;
        }

        return $this->isOwnedSupportTicket($user, $ticket);
    }

    public function createSupportAttachment(User $user, Ticket $ticket): bool
    {
        if (! $this->canAccessSupportContext($user)) {
            return false;
        }

        return $this->isOwnedSupportTicket($user, $ticket);
    }

    public function replySupport(User $user, Ticket $ticket): bool
    {
        if (! $this->canAccessAdminBoard($user)) {
            return false;
        }

        return $ticket->isUserSource();
    }

    private function canAccessAdminBoard(User $user): bool
    {
        if (! $user->isAdmin()) {
            return false;
        }

        if ($this->isImpersonating()) {
            return false;
        }

        return true;
    }

    private function canAccessSupportContext(User $user): bool
    {
        if ($user->isAdmin() && ! $this->isImpersonating()) {
            return false;
        }

        if ($user->isAthlete()) {
            return true;
        }

        if ($user->isCoach()) {
            return true;
        }

        return $user->isAdmin() && $this->isImpersonating();
    }

    private function isOwnedSupportTicket(User $user, Ticket $ticket): bool
    {
        if (! $ticket->isUserSource()) {
            return false;
        }

        return (int) $ticket->reporter_user_id === (int) $user->id;
    }
}
