<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('allows selecting the theme tab on settings overview', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=theme')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('settings/overview')
            ->where('activeTab', 'theme')
            ->has('billing')
            ->where('billing.is_subscribed', false)
            ->where('billing.subscription_status', null));
});

it('falls back to profile for unsupported settings tabs', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=unknown')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('settings/overview')
            ->where('activeTab', 'profile'));
});

it('redirects appearance route to settings theme tab', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/appearance')
        ->assertRedirect('/settings/overview?tab=theme');
});
