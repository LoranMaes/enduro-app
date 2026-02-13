<?php

use App\Models\EntryTypeEntitlement;
use App\Models\User;

it('allows admins to list update and reset entry type entitlements', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/entitlements/entry-types')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                ['key', 'category', 'label', 'requires_subscription', 'source'],
            ],
        ]);

    $this
        ->actingAs($admin)
        ->patchJson('/api/admin/entitlements/entry-types', [
            'entitlements' => [
                ['key' => 'workout.custom', 'requires_subscription' => true],
                ['key' => 'other.note', 'requires_subscription' => false],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.5.key', 'workout.custom')
        ->assertJsonPath('data.5.source', 'customized');

    $customized = EntryTypeEntitlement::query()
        ->where('key', 'workout.custom')
        ->first();

    expect($customized)->not->toBeNull();
    expect($customized?->requires_subscription)->toBeTrue();
    expect($customized?->updated_by_admin_id)->toBe($admin->id);

    $this
        ->actingAs($admin)
        ->postJson('/api/admin/entitlements/entry-types/reset')
        ->assertOk()
        ->assertJsonPath('data.5.key', 'workout.custom')
        ->assertJsonPath('data.5.source', 'config_default');

    expect(EntryTypeEntitlement::query()->count())->toBe(0);
});

it('forbids non admins and impersonated admins from entitlement api access', function () {
    $athlete = User::factory()->athlete()->create();
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($athlete)
        ->patchJson('/api/admin/entitlements/entry-types', [
            'entitlements' => [
                ['key' => 'workout.run', 'requires_subscription' => true],
            ],
        ])
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->withSession([
            'impersonation.original_user_id' => $admin->id,
            'impersonation.impersonated_user_id' => $athlete->id,
        ])
        ->getJson('/api/admin/entitlements/entry-types')
        ->assertForbidden();
});
test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
