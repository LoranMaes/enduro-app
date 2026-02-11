<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminTicketSettingsController extends Controller
{
    public function show(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);

        return redirect()->route('admin.tickets.index');
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

        return back()->with('status', 'Ticket settings updated.');
    }
}
