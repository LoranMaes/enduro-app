<?php

use App\Models\AdminSetting;
use App\Models\EntryTypeEntitlement;
use App\Models\User;

it('allows admins to update entitlement flags and archive delay', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->patch('/admin/settings', [
            'ticket_archive_delay_hours' => 36,
            'entitlements' => [
                ['key' => 'workout.custom', 'requires_subscription' => true],
                ['key' => 'other.note', 'requires_subscription' => false],
            ],
        ])
        ->assertRedirect();

    expect(AdminSetting::tickets()->ticket_archive_delay_hours)->toBe(36);

    $customWorkoutEntitlement = EntryTypeEntitlement::query()
        ->where('key', 'workout.custom')
        ->first();
    $noteEntitlement = EntryTypeEntitlement::query()
        ->where('key', 'other.note')
        ->first();

    expect($customWorkoutEntitlement)->not->toBeNull();
    expect($customWorkoutEntitlement?->requires_subscription)->toBeTrue();
    expect($noteEntitlement)->not->toBeNull();
    expect($noteEntitlement?->requires_subscription)->toBeFalse();
});

it('forbids non admin users from updating admin entitlements', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->patch('/admin/settings', [
            'ticket_archive_delay_hours' => 48,
            'entitlements' => [
                ['key' => 'other.goal', 'requires_subscription' => true],
            ],
        ])
        ->assertForbidden();
});
