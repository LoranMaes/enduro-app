<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminEntitlementsRequest;
use App\Models\AdminSetting;
use App\Models\User;
use App\Services\Entitlements\EntryTypeEntitlementService;
use App\Services\Tickets\TicketArchiveDelayResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    public function __construct(
        private readonly TicketArchiveDelayResolver $ticketArchiveDelayResolver,
        private readonly EntryTypeEntitlementService $entryTypeEntitlementService,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);

        return Inertia::render('admin/settings/index', [
            'ticketArchiveDelayHours' => $this->ticketArchiveDelayResolver->resolveHours(),
            'entryTypeEntitlements' => $this->entryTypeEntitlementService->resolvedDefinitions(),
        ]);
    }

    public function update(UpdateAdminEntitlementsRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAdmin(), 403);

        $validated = $request->validated();

        if (array_key_exists('ticket_archive_delay_hours', $validated)) {
            $settings = AdminSetting::tickets();
            $settings->ticket_archive_delay_hours = (int) $validated['ticket_archive_delay_hours'];
            $settings->save();
        }

        if (array_key_exists('entitlements', $validated)) {
            $this->entryTypeEntitlementService->updateMany(
                $validated['entitlements'],
                $user,
            );
        }

        return back()->with('status', 'Admin settings updated.');
    }
}
