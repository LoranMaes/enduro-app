<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class BillingPortalController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        if (! $user->hasStripeId()) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'No Stripe customer is linked yet.');
        }

        try {
            return $user->redirectToBillingPortal(
                route('settings.overview', [
                    'tab' => 'billing',
                ]),
            );
        } catch (Throwable) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Unable to open billing portal right now.');
        }
    }
}
