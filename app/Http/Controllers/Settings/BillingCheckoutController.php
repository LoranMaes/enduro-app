<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Billing\StripePriceIdResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;
use Throwable;

class BillingCheckoutController extends Controller
{
    public function __construct(
        private readonly StripePriceIdResolver $stripePriceIdResolver,
    ) {}

    public function __invoke(Request $request): RedirectResponse|Checkout
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        if ($user->is_subscribed || $user->subscribed('default')) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'You already have an active subscription.');
        }

        $requestedPlanKey = strtolower(trim((string) $request->query('plan', '')));
        $configuredPriceValue = $this->resolveConfiguredPriceValue($requestedPlanKey);
        $stripeSecret = trim((string) config('services.stripe.secret', ''));
        $priceId = $this->stripePriceIdResolver->resolve($configuredPriceValue);

        if ($priceId === null || $stripeSecret === '') {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Subscription checkout is not configured yet.');
        }

        $billingQuery = ['tab' => 'billing'];

        if ($requestedPlanKey !== '') {
            $billingQuery['plan'] = $requestedPlanKey;
        }

        try {
            return $user
                ->newSubscription('default', $priceId)
                ->checkout([
                    'success_url' => route('settings.overview', [
                        ...$billingQuery,
                        'checkout' => 'success',
                        'session_id' => '{CHECKOUT_SESSION_ID}',
                    ]),
                    'cancel_url' => route('settings.overview', [
                        ...$billingQuery,
                        'checkout' => 'cancel',
                    ]),
                ]);
        } catch (Throwable) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Unable to start checkout. Please try again.');
        }
    }

    private function resolveConfiguredPriceValue(string $requestedPlanKey): string
    {
        if ($requestedPlanKey !== '') {
            /** @var array<string, string> $configuredPlans */
            $configuredPlans = (array) config('services.stripe.price_plans', []);

            if (array_key_exists($requestedPlanKey, $configuredPlans)) {
                return trim((string) $configuredPlans[$requestedPlanKey]);
            }
        }

        return trim((string) config('services.stripe.default_price_id', ''));
    }
}
