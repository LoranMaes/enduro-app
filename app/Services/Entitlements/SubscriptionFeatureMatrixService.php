<?php

namespace App\Services\Entitlements;

use App\Models\SubscriptionFeatureEntitlement;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SubscriptionFeatureMatrixService
{
    private const CACHE_KEY_RESOLVED_MAP = 'subscription-feature-matrix.resolved-map.v1';

    private const CACHE_KEY_OVERRIDES = 'subscription-feature-matrix.overrides.v1';

    public function __construct(
        private readonly int $cacheSeconds = 60,
    ) {}

    /**
     * @return array<int, array{
     *     key: string,
     *     group: string,
     *     label: string,
     *     description: string,
     *     athlete_free_enabled: bool,
     *     athlete_free_limit: int|null,
     *     athlete_paid_enabled: bool,
     *     coach_paid_enabled: bool
     * }>
     */
    public function definitions(): array
    {
        /** @var array<int, array{
         *     key: string,
         *     group: string,
         *     label: string,
         *     description: string,
         *     athlete_free_enabled: bool,
         *     athlete_free_limit: int|null,
         *     athlete_paid_enabled: bool,
         *     coach_paid_enabled: bool
         * }> $definitions
         */
        $definitions = collect((array) config('subscription-features.definitions', []))
            ->map(function (mixed $definition): ?array {
                if (! is_array($definition)) {
                    return null;
                }

                $key = strtolower(trim((string) ($definition['key'] ?? '')));

                if ($key === '') {
                    return null;
                }

                return [
                    'key' => $key,
                    'group' => (string) ($definition['group'] ?? 'other'),
                    'label' => (string) ($definition['label'] ?? $key),
                    'description' => (string) ($definition['description'] ?? ''),
                    'athlete_free_enabled' => (bool) ($definition['athlete_free_enabled'] ?? false),
                    'athlete_free_limit' => $this->normalizeLimit(
                        is_numeric($definition['athlete_free_limit'] ?? null)
                            ? (int) $definition['athlete_free_limit']
                            : null,
                    ),
                    'athlete_paid_enabled' => (bool) ($definition['athlete_paid_enabled'] ?? true),
                    'coach_paid_enabled' => (bool) ($definition['coach_paid_enabled'] ?? true),
                ];
            })
            ->filter()
            ->values()
            ->all();

        return $definitions;
    }

    /**
     * @return array<string, array{
     *     athlete_free_enabled: bool,
     *     athlete_free_limit: int|null,
     *     athlete_paid_enabled: bool,
     *     coach_paid_enabled: bool
     * }>
     */
    public function resolvedMap(): array
    {
        /** @var array<string, array{
         *     athlete_free_enabled: bool,
         *     athlete_free_limit: int|null,
         *     athlete_paid_enabled: bool,
         *     coach_paid_enabled: bool
         * }> $map
         */
        $map = Cache::remember(
            self::CACHE_KEY_RESOLVED_MAP,
            now()->addSeconds($this->cacheTtlSeconds()),
            function (): array {
                $defaults = collect($this->definitions())
                    ->mapWithKeys(fn (array $definition): array => [
                        $definition['key'] => [
                            'athlete_free_enabled' => $definition['athlete_free_enabled'],
                            'athlete_free_limit' => $definition['athlete_free_limit'],
                            'athlete_paid_enabled' => $definition['athlete_paid_enabled'],
                            'coach_paid_enabled' => $definition['coach_paid_enabled'],
                        ],
                    ]);

                $overrides = collect($this->overrideEntriesMap())
                    ->mapWithKeys(function (array $override, string $key) use ($defaults): array {
                        $default = $defaults->get($key, [
                            'athlete_free_enabled' => false,
                            'athlete_free_limit' => null,
                            'athlete_paid_enabled' => true,
                            'coach_paid_enabled' => true,
                        ]);

                        return [
                            $key => [
                                'athlete_free_enabled' => $override['athlete_free_enabled'] ?? $default['athlete_free_enabled'],
                                'athlete_free_limit' => $override['athlete_free_limit'] ?? $default['athlete_free_limit'],
                                'athlete_paid_enabled' => $override['athlete_paid_enabled'] ?? $default['athlete_paid_enabled'],
                                'coach_paid_enabled' => $override['coach_paid_enabled'] ?? $default['coach_paid_enabled'],
                            ],
                        ];
                    });

                /** @var array<string, array{
                 *     athlete_free_enabled: bool,
                 *     athlete_free_limit: int|null,
                 *     athlete_paid_enabled: bool,
                 *     coach_paid_enabled: bool
                 * }> $resolved
                 */
                $resolved = $defaults
                    ->merge($overrides)
                    ->all();

                return $resolved;
            },
        );

        return $map;
    }

    /**
     * @return array<string, array{
     *     athlete_free_enabled: bool|null,
     *     athlete_free_limit: int|null,
     *     athlete_paid_enabled: bool|null,
     *     coach_paid_enabled: bool|null,
     *     updated_by_admin_id: int|null
     * }>
     */
    public function overrideEntriesMap(): array
    {
        /** @var array<string, array{
         *     athlete_free_enabled: bool|null,
         *     athlete_free_limit: int|null,
         *     athlete_paid_enabled: bool|null,
         *     coach_paid_enabled: bool|null,
         *     updated_by_admin_id: int|null
         * }> $overrides
         */
        $overrides = Cache::remember(
            self::CACHE_KEY_OVERRIDES,
            now()->addSeconds($this->cacheTtlSeconds()),
            fn (): array => SubscriptionFeatureEntitlement::query()
                ->get([
                    'key',
                    'athlete_free_enabled',
                    'athlete_free_limit',
                    'athlete_paid_enabled',
                    'coach_paid_enabled',
                    'updated_by_admin_id',
                ])
                ->mapWithKeys(fn (SubscriptionFeatureEntitlement $entitlement): array => [
                    $entitlement->key => [
                        'athlete_free_enabled' => $entitlement->athlete_free_enabled,
                        'athlete_free_limit' => $this->normalizeLimit($entitlement->athlete_free_limit),
                        'athlete_paid_enabled' => $entitlement->athlete_paid_enabled,
                        'coach_paid_enabled' => $entitlement->coach_paid_enabled,
                        'updated_by_admin_id' => $entitlement->updated_by_admin_id,
                    ],
                ])
                ->all(),
        );

        return $overrides;
    }

    /**
     * @return array<int, array{
     *     key: string,
     *     group: string,
     *     label: string,
     *     description: string,
     *     athlete_free_enabled: bool,
     *     athlete_free_limit: int|null,
     *     athlete_paid_enabled: bool,
     *     coach_paid_enabled: bool,
     *     source: 'config_default'|'customized'
     * }>
     */
    public function resolvedDefinitions(): array
    {
        $resolvedMap = $this->resolvedMap();
        $overrides = $this->overrideEntriesMap();

        return collect($this->definitions())
            ->map(function (array $definition) use ($resolvedMap, $overrides): array {
                $resolved = $resolvedMap[$definition['key']] ?? [
                    'athlete_free_enabled' => $definition['athlete_free_enabled'],
                    'athlete_free_limit' => $definition['athlete_free_limit'],
                    'athlete_paid_enabled' => $definition['athlete_paid_enabled'],
                    'coach_paid_enabled' => $definition['coach_paid_enabled'],
                ];

                return [
                    ...$definition,
                    'athlete_free_enabled' => (bool) $resolved['athlete_free_enabled'],
                    'athlete_free_limit' => $this->normalizeLimit($resolved['athlete_free_limit'] ?? null),
                    'athlete_paid_enabled' => (bool) $resolved['athlete_paid_enabled'],
                    'coach_paid_enabled' => (bool) $resolved['coach_paid_enabled'],
                    'source' => array_key_exists($definition['key'], $overrides)
                        ? 'customized'
                        : 'config_default',
                ];
            })
            ->values()
            ->all();
    }

    public function segmentForUser(User $user): string
    {
        if ($user->isCoach()) {
            return 'coach_paid';
        }

        if (! $user->isAthlete()) {
            return 'athlete_paid';
        }

        if ($this->isPaidAthlete($user)) {
            return 'athlete_paid';
        }

        return 'athlete_free';
    }

    public function enabledFor(User $user, string $featureKey): bool
    {
        $normalizedKey = strtolower(trim($featureKey));

        if ($normalizedKey === '') {
            return false;
        }

        $feature = $this->resolvedMap()[$normalizedKey] ?? null;

        if (! is_array($feature)) {
            return false;
        }

        $segment = $this->segmentForUser($user);

        if ($segment === 'coach_paid') {
            return (bool) $feature['coach_paid_enabled'];
        }

        if ($segment === 'athlete_paid') {
            return (bool) $feature['athlete_paid_enabled'];
        }

        return (bool) $feature['athlete_free_enabled'];
    }

    public function limitFor(User $user, string $featureKey): ?int
    {
        if ($this->segmentForUser($user) !== 'athlete_free') {
            return null;
        }

        $normalizedKey = strtolower(trim($featureKey));

        if ($normalizedKey === '') {
            return null;
        }

        $feature = $this->resolvedMap()[$normalizedKey] ?? null;

        if (! is_array($feature)) {
            return null;
        }

        return $this->normalizeLimit($feature['athlete_free_limit'] ?? null);
    }

    /**
     * @param  array<int, array{
     *     key: string,
     *     athlete_free_enabled: bool|null,
     *     athlete_free_limit: int|null,
     *     athlete_paid_enabled: bool|null,
     *     coach_paid_enabled: bool|null
     * }>  $entitlements
     */
    public function updateMany(array $entitlements, ?User $updatedBy = null): void
    {
        $defaultsByKey = collect($this->definitions())->keyBy('key');

        /** @var Collection<int, array{
         *     key: string,
         *     athlete_free_enabled: bool|null,
         *     athlete_free_limit: int|null,
         *     athlete_paid_enabled: bool|null,
         *     coach_paid_enabled: bool|null
         * }> $normalized
         */
        $normalized = collect($entitlements)
            ->map(function (array $entitlement): array {
                return [
                    'key' => strtolower(trim((string) ($entitlement['key'] ?? ''))),
                    'athlete_free_enabled' => array_key_exists('athlete_free_enabled', $entitlement)
                        ? ($entitlement['athlete_free_enabled'] === null
                            ? null
                            : (bool) $entitlement['athlete_free_enabled'])
                        : null,
                    'athlete_free_limit' => array_key_exists('athlete_free_limit', $entitlement)
                        ? $this->normalizeLimit(
                            is_numeric($entitlement['athlete_free_limit'])
                                ? (int) $entitlement['athlete_free_limit']
                                : null,
                        )
                        : null,
                    'athlete_paid_enabled' => array_key_exists('athlete_paid_enabled', $entitlement)
                        ? ($entitlement['athlete_paid_enabled'] === null
                            ? null
                            : (bool) $entitlement['athlete_paid_enabled'])
                        : null,
                    'coach_paid_enabled' => array_key_exists('coach_paid_enabled', $entitlement)
                        ? ($entitlement['coach_paid_enabled'] === null
                            ? null
                            : (bool) $entitlement['coach_paid_enabled'])
                        : null,
                ];
            })
            ->filter(fn (array $entitlement): bool => $entitlement['key'] !== '')
            ->values();

        if ($normalized->isEmpty()) {
            return;
        }

        foreach ($normalized as $entitlement) {
            $default = $defaultsByKey->get($entitlement['key']);

            $athleteFreeOverride = $this->normalizeOverrideValue(
                $entitlement['athlete_free_enabled'],
                is_array($default)
                    ? (bool) ($default['athlete_free_enabled'] ?? false)
                    : null,
            );
            $athleteFreeLimitOverride = $this->normalizeLimitOverrideValue(
                $entitlement['athlete_free_limit'],
                is_array($default)
                    ? $this->normalizeLimit(
                        is_numeric($default['athlete_free_limit'] ?? null)
                            ? (int) $default['athlete_free_limit']
                            : null,
                    )
                    : null,
            );
            $athletePaidOverride = $this->normalizeOverrideValue(
                $entitlement['athlete_paid_enabled'],
                is_array($default)
                    ? (bool) ($default['athlete_paid_enabled'] ?? true)
                    : null,
            );
            $coachPaidOverride = $this->normalizeOverrideValue(
                $entitlement['coach_paid_enabled'],
                is_array($default)
                    ? (bool) ($default['coach_paid_enabled'] ?? true)
                    : null,
            );

            $hasAnyOverride = $athleteFreeOverride !== null
                || $athleteFreeLimitOverride !== null
                || $athletePaidOverride !== null
                || $coachPaidOverride !== null;

            if (! $hasAnyOverride) {
                SubscriptionFeatureEntitlement::query()
                    ->where('key', $entitlement['key'])
                    ->delete();

                continue;
            }

            SubscriptionFeatureEntitlement::query()->updateOrCreate(
                ['key' => $entitlement['key']],
                [
                    'athlete_free_enabled' => $athleteFreeOverride,
                    'athlete_free_limit' => $athleteFreeLimitOverride,
                    'athlete_paid_enabled' => $athletePaidOverride,
                    'coach_paid_enabled' => $coachPaidOverride,
                    'updated_by_admin_id' => $updatedBy?->id,
                    'updated_by_admin_uuid_id' => $updatedBy?->uuid_id,
                ],
            );
        }

        $this->flushCache();
    }

    public function resetToDefaults(): void
    {
        SubscriptionFeatureEntitlement::query()->delete();
        $this->flushCache();
    }

    private function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY_RESOLVED_MAP);
        Cache::forget(self::CACHE_KEY_OVERRIDES);
    }

    private function cacheTtlSeconds(): int
    {
        $configured = (int) config('subscription-features.cache_seconds', $this->cacheSeconds);

        if ($configured < 1) {
            return $this->cacheSeconds;
        }

        return $configured;
    }

    private function isPaidAthlete(User $user): bool
    {
        if ($user->is_subscribed) {
            return true;
        }

        if ($user->subscribed('default')) {
            return true;
        }

        $status = strtolower(trim((string) $user->stripe_subscription_status));

        return in_array($status, ['active', 'trialing'], true);
    }

    private function normalizeOverrideValue(?bool $value, ?bool $default): ?bool
    {
        if ($value === null) {
            return null;
        }

        if ($default !== null && $value === $default) {
            return null;
        }

        return $value;
    }

    private function normalizeLimitOverrideValue(?int $value, ?int $default): ?int
    {
        $normalized = $this->normalizeLimit($value);

        if ($normalized === null) {
            return null;
        }

        if ($default !== null && $normalized === $default) {
            return null;
        }

        return $normalized;
    }

    private function normalizeLimit(?int $value): ?int
    {
        if ($value === null) {
            return null;
        }

        if ($value < 1) {
            return null;
        }

        return $value;
    }
}
