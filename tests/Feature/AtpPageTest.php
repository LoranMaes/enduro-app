<?php

use App\Models\User;

it('renders the atp page for athlete users', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => true,
        'stripe_subscription_status' => 'active',
    ]);

    $this
        ->actingAs($athlete)
        ->get('/atp/2026')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('atp/index')
            ->where('year', 2026)
            ->where('isLocked', false)
            ->has('plan.weeks')
            ->has('weekTypeOptions')
            ->has('priorityOptions')
        );
});

it('renders a locked preview for free athletes', function () {
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_subscription_status' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->get('/atp/2026')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('atp/index')
            ->where('year', 2026)
            ->where('isLocked', true)
            ->has('plan.weeks')
        );
});

it('forbids non athlete access to atp page', function () {
    $admin = User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->get('/atp/2026')
        ->assertForbidden();
});
