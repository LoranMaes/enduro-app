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

class AthleteSettingsOverviewController extends Controller
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

        $user->loadMissing('athleteProfile');
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
                'ftp_watts' => $user->athleteProfile?->ftp_watts,
                'max_heart_rate_bpm' => $user->athleteProfile?->max_heart_rate_bpm,
                'threshold_heart_rate_bpm' => $user->athleteProfile?->threshold_heart_rate_bpm,
                'threshold_pace_minutes_per_km' => $user->athleteProfile?->threshold_pace_minutes_per_km,
                'power_zones' => $this->normalizeZones(
                    $user->athleteProfile?->power_zones,
                    $this->defaultPowerZones(),
                ),
                'heart_rate_zones' => $this->normalizeZones(
                    $user->athleteProfile?->heart_rate_zones,
                    $this->defaultHeartRateZones(),
                ),
            ],
            'providers' => collect($this->providerManager->allowedProviders())
                ->map(fn (string $provider): array => $this->providerPayload($user, $provider))
                ->values(),
            'canManageConnections' => $user->canManageActivityProviderConnections(),
            'settingsStatus' => $request->session()->get('settings_status'),
            'connectionStatusMessage' => $request->session()->get('activity_provider_connection_message'),
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
        $allowedTabs = ['profile', 'integrations', 'billing'];

        if ($user->isAthlete()) {
            $allowedTabs[] = 'training';
        }

        if (! in_array($requestedTab, $allowedTabs, true)) {
            return 'profile';
        }

        return $requestedTab;
    }

    /**
     * @param  array<int, array{label: string, min: int, max: int}>  $defaults
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function normalizeZones(mixed $zones, array $defaults): array
    {
        if (! is_array($zones) || count($zones) !== 5) {
            return $defaults;
        }

        $normalized = [];

        foreach ($defaults as $index => $fallbackZone) {
            $zone = $zones[$index] ?? null;

            if (! is_array($zone)) {
                $normalized[] = $fallbackZone;

                continue;
            }

            $label = in_array(($zone['label'] ?? null), ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], true)
                ? (string) $zone['label']
                : $fallbackZone['label'];
            $min = is_numeric($zone['min'] ?? null)
                ? (int) $zone['min']
                : $fallbackZone['min'];
            $max = is_numeric($zone['max'] ?? null)
                ? (int) $zone['max']
                : $fallbackZone['max'];

            if ($max < $min) {
                $normalized[] = $fallbackZone;

                continue;
            }

            $normalized[] = [
                'label' => $label,
                'min' => $min,
                'max' => $max,
            ];
        }

        return $normalized;
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultPowerZones(): array
    {
        return [
            ['label' => 'Z1', 'min' => 55, 'max' => 75],
            ['label' => 'Z2', 'min' => 76, 'max' => 90],
            ['label' => 'Z3', 'min' => 91, 'max' => 105],
            ['label' => 'Z4', 'min' => 106, 'max' => 120],
            ['label' => 'Z5', 'min' => 121, 'max' => 150],
        ];
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultHeartRateZones(): array
    {
        return [
            ['label' => 'Z1', 'min' => 60, 'max' => 72],
            ['label' => 'Z2', 'min' => 73, 'max' => 82],
            ['label' => 'Z3', 'min' => 83, 'max' => 89],
            ['label' => 'Z4', 'min' => 90, 'max' => 95],
            ['label' => 'Z5', 'min' => 96, 'max' => 100],
        ];
    }
}
