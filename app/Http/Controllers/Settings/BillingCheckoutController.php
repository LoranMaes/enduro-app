<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;
use Throwable;

class BillingCheckoutController extends Controller
{
    public function __invoke(Request $request): RedirectResponse|Checkout
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        if ($user->is_subscribed || $user->subscribed('default')) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'You already have an active subscription.');
        }

        $priceId = trim((string) config('services.stripe.default_price_id', ''));

        if ($priceId === '') {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Subscription checkout is not configured yet.');
        }

        try {
            return $user
                ->newSubscription('default', $priceId)
                ->checkout([
                    'success_url' => route('settings.overview', [
                        'tab' => 'billing',
                    ]),
                    'cancel_url' => route('settings.overview', [
                        'tab' => 'billing',
                    ]),
                ]);
        } catch (Throwable) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Unable to start checkout. Please try again.');
        }
    }
}
