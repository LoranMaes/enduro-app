<?php

namespace App\Services\Entitlements;

use App\Models\EntryTypeEntitlement;
use Illuminate\Support\Collection;

class EntryTypeEntitlementService
{
    /**
     * @return array<int, array{key: string, category: string, label: string}>
     */
    public function definitions(): array
    {
        return [
            ['key' => 'workout.run', 'category' => 'workout', 'label' => 'Run'],
            ['key' => 'workout.bike', 'category' => 'workout', 'label' => 'Bike'],
            ['key' => 'workout.swim', 'category' => 'workout', 'label' => 'Swim'],
            ['key' => 'workout.day_off', 'category' => 'workout', 'label' => 'Day Off'],
            ['key' => 'workout.mtn_bike', 'category' => 'workout', 'label' => 'MTN Bike'],
            ['key' => 'workout.custom', 'category' => 'workout', 'label' => 'Custom'],
            ['key' => 'workout.walk', 'category' => 'workout', 'label' => 'Walk'],
            ['key' => 'other.event', 'category' => 'other', 'label' => 'Event'],
            ['key' => 'other.goal', 'category' => 'other', 'label' => 'Goal'],
            ['key' => 'other.note', 'category' => 'other', 'label' => 'Note'],
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function entitlementsMap(): array
    {
        $defaults = collect($this->definitions())
            ->mapWithKeys(fn (array $definition): array => [
                $definition['key'] => false,
            ]);

        $stored = EntryTypeEntitlement::query()
            ->get(['key', 'requires_subscription'])
            ->mapWithKeys(fn (EntryTypeEntitlement $entitlement): array => [
                $entitlement->key => (bool) $entitlement->requires_subscription,
            ]);

        /** @var array<string, bool> $resolved */
        $resolved = $defaults
            ->merge($stored)
            ->all();

        return $resolved;
    }

    /**
     * @return array<int, array{key: string, category: string, label: string, requires_subscription: bool}>
     */
    public function resolvedDefinitions(): array
    {
        $entitlementsMap = $this->entitlementsMap();

        return array_map(function (array $definition) use ($entitlementsMap): array {
            return [
                ...$definition,
                'requires_subscription' => (bool) ($entitlementsMap[$definition['key']] ?? false),
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
    public function updateMany(array $entitlements): void
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
                ['requires_subscription' => $entitlement['requires_subscription']],
            );
        }
    }
}
