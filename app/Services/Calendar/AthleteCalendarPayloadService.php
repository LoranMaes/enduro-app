<?php

namespace App\Services\Calendar;

use App\Http\Resources\CalendarEntryResource;
use App\Http\Resources\TrainingPlanResource;
use App\Http\Resources\TrainingSessionResource;
use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\CalendarEntry;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Activities\TrainingSessionActualMetricsResolver;
use App\Services\Entitlements\EntryTypeEntitlementService;
use App\Support\QueryScopes\TrainingScope;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class AthleteCalendarPayloadService
{
    public function __construct(
        private readonly TrainingSessionActualMetricsResolver $actualMetricsResolver,
        private readonly EntryTypeEntitlementService $entryTypeEntitlementService,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{
     *     trainingPlans: array<string, mixed>,
     *     trainingSessions: array<string, mixed>,
     *     activities: array{data: array<int, array<string, mixed>>},
     *     calendarEntries: array<string, mixed>,
     *     calendarWindow: array{starts_at: string, ends_at: string},
     *     providerStatus: array<string, array{connected: bool, last_synced_at: string|null, last_sync_status: string|null, provider_athlete_id: string|null}>|null,
     *     entryTypeEntitlements: array<int, array{key: string, category: string, label: string, requires_subscription: bool}>,
     *     isSubscribed: bool,
     *     athleteTrainingTargets: array{
     *         ftp_watts: int|null,
     *         max_heart_rate_bpm: int|null,
     *         threshold_heart_rate_bpm: int|null,
     *         threshold_pace_minutes_per_km: int|null,
     *         power_zones: array<int, array{label: string, min: int, max: int}>,
     *         heart_rate_zones: array<int, array{label: string, min: int, max: int}>
     *     }|null
     * }
     */
    public function build(User $authenticatedUser, array $validated = [], ?User $athlete = null): array
    {
        $perPage = (int) ($validated['per_page'] ?? 20);
        $calendarWindow = $this->resolveCalendarWindow($validated);

        $plans = $this->queryPlans($authenticatedUser, $athlete)
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

        $trainingSessions = $this->querySessions($authenticatedUser, $athlete)
            ->whereDate('scheduled_date', '>=', $calendarWindow['starts_at'])
            ->whereDate('scheduled_date', '<=', $calendarWindow['ends_at'])
            ->with('activity')
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get();

        $activities = $this->queryActivities($authenticatedUser, $athlete)
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
        $calendarEntries = $this->queryCalendarEntries($authenticatedUser, $athlete)
            ->whereDate('scheduled_date', '>=', $calendarWindow['starts_at'])
            ->whereDate('scheduled_date', '<=', $calendarWindow['ends_at'])
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->get();

        $metricsUser = $athlete ?? $authenticatedUser;
        $athleteSettingsSubject = $athlete instanceof User
            ? $athlete
            : ($authenticatedUser->isAthlete() ? $authenticatedUser : null);

        return [
            'trainingPlans' => TrainingPlanResource::collection($plans)->response()->getData(true),
            'trainingSessions' => TrainingSessionResource::collection($trainingSessions)->response()->getData(true),
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
                            $metricsUser,
                        ),
                    ],
                )->values()->all(),
            ],
            'calendarEntries' => CalendarEntryResource::collection($calendarEntries)
                ->response()
                ->getData(true),
            'calendarWindow' => $calendarWindow,
            'providerStatus' => $this->resolveProviderStatus($athleteSettingsSubject),
            'entryTypeEntitlements' => $this->entryTypeEntitlementService->resolvedDefinitions(),
            'isSubscribed' => (bool) ($athleteSettingsSubject?->is_subscribed ?? false),
            'athleteTrainingTargets' => $this->resolveAthleteTrainingTargets($athleteSettingsSubject),
        ];
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

    private function queryPlans(User $authenticatedUser, ?User $athlete): Builder
    {
        if ($athlete instanceof User) {
            return TrainingPlan::query()->where('user_id', $athlete->id);
        }

        return TrainingScope::forVisiblePlans($authenticatedUser);
    }

    private function querySessions(User $authenticatedUser, ?User $athlete): Builder
    {
        if ($athlete instanceof User) {
            return TrainingSession::query()->where('user_id', $athlete->id);
        }

        return TrainingScope::forVisibleSessions($authenticatedUser);
    }

    private function queryActivities(User $authenticatedUser, ?User $athlete): Builder
    {
        if ($athlete instanceof User) {
            return Activity::query()->where('athlete_id', $athlete->id);
        }

        return TrainingScope::forVisibleActivities($authenticatedUser);
    }

    private function queryCalendarEntries(User $authenticatedUser, ?User $athlete): Builder
    {
        if ($athlete instanceof User) {
            return CalendarEntry::query()->where('user_id', $athlete->id);
        }

        if ($authenticatedUser->isAthlete()) {
            return CalendarEntry::query()->where('user_id', $authenticatedUser->id);
        }

        return CalendarEntry::query()->whereKey([]);
    }

    /**
     * @return array<string, array{
     *     connected: bool,
     *     last_synced_at: string|null,
     *     last_sync_status: string|null,
     *     provider_athlete_id: string|null
     * }>|null
     */
    private function resolveProviderStatus(?User $athlete): ?array
    {
        if (! $athlete instanceof User || ! $athlete->isAthlete()) {
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
            ->where('user_id', $athlete->id)
            ->whereIn('provider', $allowedProviders)
            ->get()
            ->keyBy(fn (ActivityProviderConnection $connection): string => strtolower($connection->provider));

        $status = [];

        foreach ($allowedProviders as $provider) {
            $normalizedProvider = strtolower(trim($provider));
            $connection = $connections->get($normalizedProvider);
            $legacyConnected = $normalizedProvider === 'strava'
                && trim((string) $athlete->strava_access_token) !== '';

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
    private function resolveAthleteTrainingTargets(?User $athlete): ?array
    {
        if (! $athlete instanceof User || ! $athlete->isAthlete()) {
            return null;
        }

        $athlete->loadMissing('athleteProfile');

        return [
            'ftp_watts' => $athlete->athleteProfile?->ftp_watts,
            'max_heart_rate_bpm' => $athlete->athleteProfile?->max_heart_rate_bpm,
            'threshold_heart_rate_bpm' => $athlete->athleteProfile?->threshold_heart_rate_bpm,
            'threshold_pace_minutes_per_km' => $athlete->athleteProfile?->threshold_pace_minutes_per_km,
            'power_zones' => $this->defaultPowerZones($athlete->athleteProfile?->power_zones),
            'heart_rate_zones' => $this->defaultHeartRateZones($athlete->athleteProfile?->heart_rate_zones),
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
