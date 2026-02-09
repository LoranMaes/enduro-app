<?php

namespace App\Http\Controllers;

use App\Http\Resources\TrainingSessionResource;
use App\Models\ActivityProviderConnection;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AthleteSessionDetailController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        Request $request,
        TrainingSession $trainingSession,
    ): Response {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAthlete(), 403);

        $this->authorize('view', $trainingSession);

        $trainingSession->loadMissing('activity');

        return Inertia::render('calendar/session-detail', [
            'session' => (new TrainingSessionResource($trainingSession))->resolve(),
            'providerStatus' => $this->resolveProviderStatus($user),
        ]);
    }

    /**
     * @return array<string, array{
     *     connected: bool,
     *     last_synced_at: string|null,
     *     last_sync_status: string|null,
     *     provider_athlete_id: string|null
     * }>|null
     */
    private function resolveProviderStatus(User $user): ?array
    {
        $allowedProviders = array_values(array_filter(
            (array) config('services.activity_providers.allowed', ['strava']),
            static fn (mixed $provider): bool => is_string($provider) && trim($provider) !== '',
        ));

        if ($allowedProviders === []) {
            return null;
        }

        $connections = ActivityProviderConnection::query()
            ->where('user_id', $user->id)
            ->whereIn('provider', $allowedProviders)
            ->get()
            ->keyBy(fn (ActivityProviderConnection $connection): string => strtolower($connection->provider));

        $status = [];

        foreach ($allowedProviders as $provider) {
            $normalizedProvider = strtolower(trim($provider));
            $connection = $connections->get($normalizedProvider);
            $legacyConnected = $normalizedProvider === 'strava'
                && trim((string) $user->strava_access_token) !== '';

            $status[$normalizedProvider] = [
                'connected' => $connection instanceof ActivityProviderConnection || $legacyConnected,
                'last_synced_at' => $connection?->last_synced_at?->toIso8601String(),
                'last_sync_status' => $connection?->last_sync_status,
                'provider_athlete_id' => $connection?->provider_athlete_id,
            ];
        }

        return $status;
    }
}
