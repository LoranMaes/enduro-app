<?php

use App\Models\User;

it('shows the workout types tab in admin settings for admins', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->get('/admin/settings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/index')
            ->has('entryTypeEntitlements')
            ->where('entryTypeEntitlements.0.category', 'workout')
        );
});

it('forbids athlete access to admin settings', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/admin/settings')
        ->assertForbidden();
});

it('hides admin settings while impersonating', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->get('/admin/settings')
        ->assertForbidden();
});
