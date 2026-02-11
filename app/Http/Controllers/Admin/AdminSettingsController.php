<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\User;
use App\Services\Tickets\TicketArchiveDelayResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        private readonly TicketArchiveDelayResolver $ticketArchiveDelayResolver,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);

        return Inertia::render('admin/settings/index', [
            'ticketArchiveDelayHours' => $this->ticketArchiveDelayResolver->resolveHours(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);

        $validated = $request->validate([
            'ticket_archive_delay_hours' => ['required', 'integer', 'min:1', 'max:168'],
        ]);

        $settings = AdminSetting::tickets();
        $settings->ticket_archive_delay_hours = (int) $validated['ticket_archive_delay_hours'];
        $settings->save();

        return back()->with('status', 'Admin settings updated.');
    }
}
