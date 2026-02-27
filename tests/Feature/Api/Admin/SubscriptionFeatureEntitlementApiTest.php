<?php

use App\Models\SubscriptionFeatureEntitlement;
use App\Models\User;

it('allows admins to list update and reset subscription feature entitlements', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/entitlements/subscription-features')
        ->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                [
                    'key',
                    'group',
                    'label',
                    'description',
                    'athlete_free_enabled',
                    'athlete_free_limit',
                    'athlete_paid_enabled',
                    'coach_paid_enabled',
                    'source',
                ],
            ],
        ]);

    $this
        ->actingAs($admin)
        ->patchJson('/api/admin/entitlements/subscription-features', [
            'entitlements' => [
                [
                    'key' => 'workout.library',
                    'athlete_free_enabled' => true,
                    'athlete_free_limit' => 4,
                    'athlete_paid_enabled' => true,
                    'coach_paid_enabled' => true,
                ],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonFragment([
            'key' => 'workout.library',
            'source' => 'customized',
        ]);

    $customized = SubscriptionFeatureEntitlement::query()
        ->where('key', 'workout.library')
        ->first();

    expect($customized)->not->toBeNull();
    expect($customized?->athlete_free_enabled)->toBeTrue();
    expect($customized?->athlete_free_limit)->toBe(4);
    expect($customized?->updated_by_admin_id)->toBe($admin->id);
    expect($customized?->updated_by_admin_uuid_id)->toBe($admin->uuid_id);

    $this
        ->actingAs($admin)
        ->postJson('/api/admin/entitlements/subscription-features/reset')
        ->assertSuccessful()
        ->assertJsonFragment([
            'key' => 'workout.library',
            'source' => 'config_default',
        ]);

    expect(SubscriptionFeatureEntitlement::query()->count())->toBe(0);
});

it('forbids non admins and impersonated admins from subscription feature entitlement api access', function () {
    $athlete = User::factory()->athlete()->create();
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($athlete)
        ->patchJson('/api/admin/entitlements/subscription-features', [
            'entitlements' => [
                [
                    'key' => 'workout.library',
                    'athlete_free_enabled' => true,
                    'athlete_free_limit' => 2,
                    'athlete_paid_enabled' => true,
                    'coach_paid_enabled' => true,
                ],
            ],
        ])
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->withSession([
            'impersonation.original_user_id' => $admin->id,
            'impersonation.impersonated_user_id' => $athlete->id,
        ])
        ->getJson('/api/admin/entitlements/subscription-features')
        ->assertForbidden();
});
