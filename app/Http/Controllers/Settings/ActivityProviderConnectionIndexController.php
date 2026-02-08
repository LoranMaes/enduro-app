<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityProviderConnectionIndexController extends Controller
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $providers = collect($this->providerManager->allowedProviders())
            ->map(function (string $provider) use ($user): array {
                $connection = $this->connectionStore->find($user, $provider);
                $legacyConnected = $provider === 'strava'
                    && trim((string) $user->strava_access_token) !== '';

                return $this->providerPayload(
                    provider: $provider,
                    connection: $connection,
                    connected: $connection instanceof ActivityProviderConnection || $legacyConnected,
                );
            })
            ->values();

        return Inertia::render('settings/connections', [
            'providers' => $providers,
            'canManageConnections' => $user->canManageActivityProviderConnections(),
            'statusMessage' => $request->session()->get('activity_provider_connection_message'),
        ]);
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
    private function providerPayload(
        string $provider,
        ?ActivityProviderConnection $connection,
        bool $connected,
    ): array {
        return [
            'provider' => $provider,
            'label' => ucfirst($provider),
            'connected' => $connected,
            'provider_athlete_id' => $connection?->provider_athlete_id,
            'token_expires_at' => $connection?->token_expires_at?->toIso8601String(),
            'last_synced_at' => $connection?->last_synced_at?->toIso8601String(),
            'last_sync_status' => $connection?->last_sync_status,
            'last_sync_reason' => $connection?->last_sync_reason,
        ];
    }
}
