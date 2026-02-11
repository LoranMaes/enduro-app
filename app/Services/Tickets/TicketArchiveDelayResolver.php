<?php

namespace App\Services\Tickets;

use App\Models\AdminSetting;

class TicketArchiveDelayResolver
{
    public function resolveHours(): int
    {
        $fallback = max(1, (int) config('tickets.archive_delay_hours', 24));

        try {
            return max(1, (int) AdminSetting::tickets()->ticket_archive_delay_hours);
        } catch (\Throwable) {
            return $fallback;
        }
    }
}
