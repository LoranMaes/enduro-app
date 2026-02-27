<?php

namespace App\Services\Entitlements;

use App\Models\EntryTypeEntitlement;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class EntryTypeEntitlementService
{
    private const CACHE_KEY_MAP = 'entry-type-entitlements.map.v1';

    private const CACHE_KEY_OVERRIDES = 'entry-type-entitlements.overrides.v1';

    /**
     * @return array<int, array{key: string, category: string, label: string}>
     */
    public function definitions(): array
    {
        /** @var array<int, array{key: string, category: string, label: string}> $definitions */
        $definitions = config('training.entry_types.definitions', []);

        return $definitions;
    }

    /**
     * @return array<string, bool>
     */
    public function entitlementsMap(): array
    {
        /** @var array<string, bool> $resolved */
        $resolved = Cache::remember(
            self::CACHE_KEY_MAP,
            now()->addSeconds(60),
            function (): array {
                $defaults = collect(
                    config('training.entry_types.defaults', []),
                )
                    ->mapWithKeys(fn (mixed $value, mixed $key): array => [
                        strtolower(trim((string) $key)) => (bool) $value,
                    ]);

                $stored = EntryTypeEntitlement::query()
                    ->get(['key', 'requires_subscription'])
                    ->mapWithKeys(fn (EntryTypeEntitlement $entitlement): array => [
                        $entitlement->key => (bool) $entitlement->requires_subscription,
                    ]);

                /** @var array<string, bool> $merged */
                $merged = $defaults
                    ->merge($stored)
                    ->all();

                return $merged;
            },
        );

        return $resolved;
    }

    /**
     * @return array<string, array{requires_subscription: bool, updated_by_admin_id: int|null}>
     */
    public function overrideEntriesMap(): array
    {
        /** @var array<string, array{requires_subscription: bool, updated_by_admin_id: int|null}> $overrides */
        $overrides = Cache::remember(
            self::CACHE_KEY_OVERRIDES,
            now()->addSeconds(60),
            static function (): array {
                /** @var array<string, array{requires_subscription: bool, updated_by_admin_id: int|null}> $mapped */
                $mapped = EntryTypeEntitlement::query()
                    ->get(['key', 'requires_subscription', 'updated_by_admin_id'])
                    ->mapWithKeys(fn (EntryTypeEntitlement $entitlement): array => [
                        $entitlement->key => [
                            'requires_subscription' => (bool) $entitlement->requires_subscription,
                            'updated_by_admin_id' => $entitlement->updated_by_admin_id !== null
                                ? (int) $entitlement->updated_by_admin_id
                                : null,
                        ],
                    ])
                    ->all();

                return $mapped;
            },
        );

        return $overrides;
    }

    /**
     * @return array<int, array{
     *     key: string,
     *     category: string,
     *     label: string,
     *     requires_subscription: bool,
     *     source: 'config_default'|'customized'
     * }>
     */
    public function resolvedDefinitions(): array
    {
        $entitlementsMap = $this->entitlementsMap();
        $overrideMap = $this->overrideEntriesMap();

        return array_map(function (array $definition) use ($entitlementsMap, $overrideMap): array {
            return [
                ...$definition,
                'requires_subscription' => (bool) ($entitlementsMap[$definition['key']] ?? false),
                'source' => array_key_exists($definition['key'], $overrideMap)
                    ? 'customized'
                    : 'config_default',
            ];
        }, $this->definitions());
    }

    public function requiresSubscription(string $entryTypeKey): bool
    {
        $normalizedKey = strtolower(trim($entryTypeKey));

        if ($normalizedKey === '') {
            return false;
        }

        return (bool) ($this->entitlementsMap()[$normalizedKey] ?? false);
    }

    /**
     * @param  array<int, array{key: string, requires_subscription: bool}>  $entitlements
     */
    public function updateMany(array $entitlements, ?User $updatedBy = null): void
    {
        /** @var Collection<int, array{key: string, requires_subscription: bool}> $normalized */
        $normalized = collect($entitlements)
            ->map(function (array $entitlement): array {
                return [
                    'key' => strtolower(trim($entitlement['key'])),
                    'requires_subscription' => (bool) $entitlement['requires_subscription'],
                ];
            })
            ->filter(fn (array $entitlement): bool => $entitlement['key'] !== '')
            ->values();

        if ($normalized->isEmpty()) {
            return;
        }

        foreach ($normalized as $entitlement) {
            EntryTypeEntitlement::query()->updateOrCreate(
                ['key' => $entitlement['key']],
                [
                    'requires_subscription' => $entitlement['requires_subscription'],
                    'updated_by_admin_id' => $updatedBy?->id,
                ],
            );
        }

        $this->flushCache();
    }

    public function resetToDefaults(): void
    {
        EntryTypeEntitlement::query()->delete();
        $this->flushCache();
    }

    private function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY_MAP);
        Cache::forget(self::CACHE_KEY_OVERRIDES);
    }
}
