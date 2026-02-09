<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AthleteActivityDetailController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, Activity $activity): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->isAthlete(), 403);

        $this->authorize('view', $activity);

        if ($activity->training_session_id !== null) {
            return redirect()->route('sessions.show', $activity->training_session_id);
        }

        return Inertia::render('calendar/session-detail', [
            'session' => $this->sessionPayloadFromActivity($activity),
            'providerStatus' => $this->resolveProviderStatus($user),
            'isActivityOnly' => true,
        ]);
    }

    /**
     * @return array{
     *     id: int,
     *     training_week_id: int|null,
     *     scheduled_date: string,
     *     sport: string,
     *     status: string,
     *     is_completed: bool,
     *     completed_at: string|null,
     *     duration_minutes: int,
     *     actual_duration_minutes: int,
     *     planned_tss: int|null,
     *     actual_tss: int|null,
     *     notes: string|null,
     *     planned_structure: null,
     *     linked_activity_id: int,
     *     linked_activity_summary: array{
     *         id: int,
     *         provider: string,
     *         started_at: string|null,
     *         duration_seconds: int|null,
     *         sport: string|null
     *     },
     *     suggested_activities: array<int, array<string, mixed>>
     * }
     */
    private function sessionPayloadFromActivity(Activity $activity): array
    {
        $durationMinutes = max(1, (int) round((int) ($activity->duration_seconds ?? 0) / 60));

        return [
            'id' => -$activity->id,
            'training_week_id' => null,
            'scheduled_date' => $activity->started_at?->toDateString() ?? now()->toDateString(),
            'sport' => $activity->sport,
            'status' => 'completed',
            'is_completed' => true,
            'completed_at' => $activity->started_at?->toIso8601String(),
            'duration_minutes' => $durationMinutes,
            'actual_duration_minutes' => $durationMinutes,
            'planned_tss' => null,
            'actual_tss' => null,
            'notes' => null,
            'planned_structure' => null,
            'linked_activity_id' => $activity->id,
            'linked_activity_summary' => [
                'id' => $activity->id,
                'provider' => $activity->provider,
                'started_at' => $activity->started_at?->toIso8601String(),
                'duration_seconds' => $activity->duration_seconds,
                'sport' => $activity->sport,
            ],
            'suggested_activities' => [],
        ];
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
