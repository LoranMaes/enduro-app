<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\IndexRequest;
use App\Http\Resources\TrainingPlanResource;
use App\Http\Resources\TrainingSessionResource;
use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
    ) {}

    /**
     * Display the dashboard.
     */
    public function __invoke(IndexRequest $request): Response|RedirectResponse
    {
        if ($request->user()->isAdmin()) {
            return redirect()->route('admin.index');
        }

        $this->authorize('viewAny', TrainingPlan::class);

        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 20);
        $calendarWindow = $this->resolveCalendarWindow($validated);

        $plans = $this->queryForUser($request->user())
            ->when(
                isset($validated['starts_from']),
                fn (Builder $query) => $query->whereDate('ends_at', '>=', $validated['starts_from']),
            )
            ->when(
                isset($validated['ends_to']),
                fn (Builder $query) => $query->whereDate('starts_at', '<=', $validated['ends_to']),
            )
            ->with([
                'trainingWeeks' => function ($query): void {
                    $query->orderBy('starts_at')->with([
                        'trainingSessions' => function ($sessionQuery): void {
                            $sessionQuery
                                ->orderBy('scheduled_date')
                                ->with('activity');
                        },
                    ]);
                },
            ])
            ->orderByDesc('starts_at')
            ->paginate($perPage)
            ->withQueryString();

        $trainingPlanResource = TrainingPlanResource::collection($plans);
        $trainingSessionResource = TrainingSessionResource::collection(
            $this->querySessionsForUser($request->user())
                ->whereDate('scheduled_date', '>=', $calendarWindow['starts_at'])
                ->whereDate('scheduled_date', '<=', $calendarWindow['ends_at'])
                ->with('activity')
                ->orderBy('scheduled_date')
                ->orderBy('id')
                ->get(),
        );
        $activities = $this->queryActivitiesForUser($request->user())
            ->whereDate('started_at', '>=', $calendarWindow['starts_at'])
            ->whereDate('started_at', '<=', $calendarWindow['ends_at'])
            ->orderBy('started_at')
            ->orderBy('id')
            ->get([
                'id',
                'training_session_id',
                'athlete_id',
                'provider',
                'external_id',
                'sport',
                'started_at',
                'duration_seconds',
                'distance_meters',
                'elevation_gain_meters',
                'raw_payload',
            ]);

        return Inertia::render('dashboard', [
            'trainingPlans' => $trainingPlanResource->response()->getData(true),
            'trainingSessions' => $trainingSessionResource->response()->getData(true),
            'activities' => [
                'data' => $activities->map(
                    fn (Activity $activity): array => [
                        'id' => $activity->id,
                        'training_session_id' => $activity->training_session_id,
                        'linked_session_id' => $activity->training_session_id,
                        'athlete_id' => $activity->athlete_id,
                        'provider' => $activity->provider,
                        'external_id' => $activity->external_id,
                        'sport' => $activity->sport,
                        'started_at' => $activity->started_at?->toISOString(),
                        'duration_seconds' => $activity->duration_seconds,
                        'distance_meters' => $activity->distance_meters,
                        'elevation_gain_meters' => $activity->elevation_gain_meters,
                        'resolved_tss' => $this->actualMetricsResolver->resolveActivityTss(
                            $activity,
                            $request->user(),
                        ),
                    ],
                )->values(),
            ],
            'calendarWindow' => $calendarWindow,
            'providerStatus' => $this->resolveProviderStatus($request->user()),
            'athleteTrainingTargets' => $this->resolveAthleteTrainingTargets($request->user()),
        ]);
    }

    private function queryForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingPlan::query();
        }

        if ($user->isAthlete()) {
            return TrainingPlan::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingPlan::query()->whereIn(
                'user_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return TrainingPlan::query()->whereRaw('1 = 0');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{starts_at: string, ends_at: string}
     */
    private function resolveCalendarWindow(array $validated): array
    {
        $today = CarbonImmutable::today();
        $defaultStartsAt = $today->startOfWeek()->subWeeks(4)->toDateString();
        $defaultEndsAt = $today->endOfWeek()->addWeeks(4)->toDateString();

        return [
            'starts_at' => (string) ($validated['starts_from'] ?? $defaultStartsAt),
            'ends_at' => (string) ($validated['ends_to'] ?? $defaultEndsAt),
        ];
    }

    private function querySessionsForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return TrainingSession::query();
        }

        if ($user->isAthlete()) {
            return TrainingSession::query()->where('user_id', $user->id);
        }

        if ($user->isCoach()) {
            return TrainingSession::query()->whereIn(
                'user_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return TrainingSession::query()->whereRaw('1 = 0');
    }

    private function queryActivitiesForUser(User $user): Builder
    {
        if ($user->isAdmin()) {
            return Activity::query();
        }

        if ($user->isAthlete()) {
            return Activity::query()->where('athlete_id', $user->id);
        }

        if ($user->isCoach()) {
            return Activity::query()->whereIn(
                'athlete_id',
                $user->coachedAthletes()->select('users.id'),
            );
        }

        return Activity::query()->whereRaw('1 = 0');
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
        if (! $user->isAthlete()) {
            return null;
        }

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

    /**
     * @return array{
     *     ftp_watts: int|null,
     *     max_heart_rate_bpm: int|null,
     *     threshold_heart_rate_bpm: int|null,
     *     threshold_pace_minutes_per_km: int|null,
     *     power_zones: array<int, array{label: string, min: int, max: int}>,
     *     heart_rate_zones: array<int, array{label: string, min: int, max: int}>
     * }|null
     */
    private function resolveAthleteTrainingTargets(User $user): ?array
    {
        if (! $user->isAthlete()) {
            return null;
        }

        $user->loadMissing('athleteProfile');

        return [
            'ftp_watts' => $user->athleteProfile?->ftp_watts,
            'max_heart_rate_bpm' => $user->athleteProfile?->max_heart_rate_bpm,
            'threshold_heart_rate_bpm' => $user->athleteProfile?->threshold_heart_rate_bpm,
            'threshold_pace_minutes_per_km' => $user->athleteProfile?->threshold_pace_minutes_per_km,
            'power_zones' => $this->defaultPowerZones($user->athleteProfile?->power_zones),
            'heart_rate_zones' => $this->defaultHeartRateZones($user->athleteProfile?->heart_rate_zones),
        ];
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultPowerZones(mixed $zones): array
    {
        $fallback = [
            ['label' => 'Z1', 'min' => 55, 'max' => 75],
            ['label' => 'Z2', 'min' => 76, 'max' => 90],
            ['label' => 'Z3', 'min' => 91, 'max' => 105],
            ['label' => 'Z4', 'min' => 106, 'max' => 120],
            ['label' => 'Z5', 'min' => 121, 'max' => 150],
        ];

        return $this->normalizeZones($zones, $fallback);
    }

    /**
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function defaultHeartRateZones(mixed $zones): array
    {
        $fallback = [
            ['label' => 'Z1', 'min' => 60, 'max' => 72],
            ['label' => 'Z2', 'min' => 73, 'max' => 82],
            ['label' => 'Z3', 'min' => 83, 'max' => 89],
            ['label' => 'Z4', 'min' => 90, 'max' => 95],
            ['label' => 'Z5', 'min' => 96, 'max' => 100],
        ];

        return $this->normalizeZones($zones, $fallback);
    }

    /**
     * @param  array<int, array{label: string, min: int, max: int}>  $fallback
     * @return array<int, array{label: string, min: int, max: int}>
     */
    private function normalizeZones(mixed $zones, array $fallback): array
    {
        if (! is_array($zones) || count($zones) !== 5) {
            return $fallback;
        }

        $normalized = [];

        foreach ($fallback as $index => $defaults) {
            $zone = $zones[$index] ?? null;

            if (! is_array($zone)) {
                $normalized[] = $defaults;

                continue;
            }

            $min = is_numeric($zone['min'] ?? null) ? (int) $zone['min'] : $defaults['min'];
            $max = is_numeric($zone['max'] ?? null) ? (int) $zone['max'] : $defaults['max'];
            $label = in_array(($zone['label'] ?? null), ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'], true)
                ? (string) $zone['label']
                : $defaults['label'];

            if ($max < $min) {
                $normalized[] = $defaults;

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
}
