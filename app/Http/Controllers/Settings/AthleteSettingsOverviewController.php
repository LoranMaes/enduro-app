<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\Billing\StripeCheckoutSessionSyncService;
use App\Services\Performance\AthletePerformanceProfileResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AthleteSettingsOverviewController extends Controller
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
        private readonly AthletePerformanceProfileResolver $athletePerformanceProfileResolver,
        private readonly StripeCheckoutSessionSyncService $stripeCheckoutSessionSyncService,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $checkoutReturnRedirect = $this->resolveCheckoutReturnRedirect($request, $user);

        if ($checkoutReturnRedirect instanceof RedirectResponse) {
            return $checkoutReturnRedirect;
        }

        $user->loadMissing('athleteProfile');
        $resolvedPerformanceProfile = $this->athletePerformanceProfileResolver->resolve(
            $user->athleteProfile,
        );
        $activeTab = $this->resolveActiveTab($request, $user);

        return Inertia::render('settings/overview', [
            'activeTab' => $activeTab,
            'role' => $user->role?->value ?? 'athlete',
            'profile' => [
                'name' => $user->fullName(),
                'email' => $user->email,
                'timezone' => $user->timezone ?? config('app.timezone', 'UTC'),
                'unit_system' => $user->unit_system ?? 'metric',
            ],
            'trainingPreferences' => [
                'primary_sport' => $user->athleteProfile?->primary_sport ?? 'triathlon',
                'weekly_training_days' => $user->athleteProfile?->weekly_training_days ?? 6,
                'preferred_rest_day' => $user->athleteProfile?->preferred_rest_day ?? 'monday',
                'intensity_distribution' => $user->athleteProfile?->intensity_distribution ?? 'polarized',
                'ftp_watts' => $resolvedPerformanceProfile['ftp_watts'],
                'max_heart_rate_bpm' => $resolvedPerformanceProfile['max_heart_rate_bpm'],
                'threshold_heart_rate_bpm' => $resolvedPerformanceProfile['threshold_heart_rate_bpm'],
                'threshold_pace_minutes_per_km' => $resolvedPerformanceProfile['threshold_pace_minutes_per_km'],
                'power_zones' => $resolvedPerformanceProfile['power_zones'],
                'heart_rate_zones' => $resolvedPerformanceProfile['heart_rate_zones'],
            ],
            'providers' => collect($this->providerManager->allowedProviders())
                ->map(fn (string $provider): array => $this->providerPayload($user, $provider))
                ->values(),
            'billing' => [
                'is_subscribed' => (bool) $user->is_subscribed,
                'subscription_status' => $user->stripe_subscription_status,
                'stripe_customer_id' => trim((string) $user->stripe_customer_id) !== ''
                    ? trim((string) $user->stripe_customer_id)
                    : null,
                'stripe_id' => trim((string) $user->stripe_id) !== ''
                    ? trim((string) $user->stripe_id)
                    : null,
                'subscription_synced_at' => $user->stripe_subscription_synced_at?->toIso8601String(),
                'plans' => $this->resolveBillingPlans(),
            ],
            'canManageConnections' => $user->canManageActivityProviderConnections(),
            'settingsStatus' => $request->session()->get('settings_status'),
            'connectionStatusMessage' => $request->session()->get('activity_provider_connection_message'),
            'billingStatusMessage' => $request->session()->get('billing_status_message'),
        ]);
    }

    private function resolveCheckoutReturnRedirect(
        Request $request,
        User $user,
    ): ?RedirectResponse {
        if (strtolower(trim((string) $request->query('tab', ''))) !== 'billing') {
            return null;
        }

        $checkoutState = strtolower(trim((string) $request->query('checkout', '')));

        if ($checkoutState === '') {
            return null;
        }

        if ($checkoutState === 'cancel') {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Checkout was canceled. No charges were made.');
        }

        if ($checkoutState !== 'success') {
            return null;
        }

        $checkoutSessionId = trim((string) $request->query('session_id', ''));

        if ($checkoutSessionId === '') {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Checkout completed. Waiting for subscription confirmation.');
        }

        $didSync = $this->stripeCheckoutSessionSyncService->sync(
            $user,
            $checkoutSessionId,
        );

        if ($didSync) {
            return redirect()
                ->route('settings.overview', ['tab' => 'billing'])
                ->with('billing_status_message', 'Subscription activated successfully.');
        }

        return redirect()
            ->route('settings.overview', ['tab' => 'billing'])
            ->with('billing_status_message', 'Checkout completed. Waiting for subscription confirmation.');
    }

    /**
     * @return array<int, array{
     *     key: string,
     *     label: string,
     *     subscribe_url: string
     * }>
     */
    private function resolveBillingPlans(): array
    {
        /** @var array<string, string> $configuredPlans */
        $configuredPlans = (array) config('services.stripe.price_plans', []);

        return collect($configuredPlans)
            ->map(function (string $priceValue, string $planKey): ?array {
                if (trim($priceValue) === '') {
                    return null;
                }

                return [
                    'key' => $planKey,
                    'label' => Str::headline($planKey),
                    'subscribe_url' => route('settings.overview.billing.subscribe', [
                        'plan' => $planKey,
                    ]),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     provider: string,
     *     label: string,
     *     connected: bool,
     *     provider_athlete_id: string|null,
     *     token_expires_at: string|null,
     *     last_synced_at: string|null,
     *     last_sync_status: string|null,
     *     last_sync_reason: string|null
     * }
     */
    private function providerPayload(User $user, string $provider): array
    {
        $connection = $this->connectionStore->find($user, $provider);
        $legacyConnected = $provider === 'strava'
            && trim((string) $user->strava_access_token) !== '';

        return [
            'provider' => $provider,
            'label' => ucfirst($provider),
            'connected' => $connection instanceof ActivityProviderConnection || $legacyConnected,
            'provider_athlete_id' => $connection?->provider_athlete_id,
            'token_expires_at' => $connection?->token_expires_at?->toIso8601String(),
            'last_synced_at' => $connection?->last_synced_at?->toIso8601String(),
            'last_sync_status' => $connection?->last_sync_status,
            'last_sync_reason' => $connection?->last_sync_reason,
        ];
    }

    private function resolveActiveTab(Request $request, User $user): string
    {
        $requestedTab = strtolower(trim((string) $request->query('tab', 'profile')));
        $allowedTabs = ['profile', 'theme', 'integrations', 'billing'];

        if ($user->isAthlete()) {
            $allowedTabs[] = 'training';
        }

        if (! in_array($requestedTab, $allowedTabs, true)) {
            return 'profile';
        }

        return $requestedTab;
    }
}
