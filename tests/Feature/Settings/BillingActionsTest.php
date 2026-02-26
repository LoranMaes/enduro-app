<?php

use App\Models\User;

it('redirects unauthenticated users for billing subscribe action', function () {
    $this
        ->get('/settings/overview/billing/subscribe')
        ->assertRedirect(route('login'));
});

it('shows a billing message when checkout is not configured', function () {
    config()->set('services.stripe.default_price_id', null);

    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/overview/billing/subscribe')
        ->assertRedirect('/settings/overview?tab=billing');

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing')
        ->assertInertia(fn ($page) => $page
            ->where('billingStatusMessage', 'Subscription checkout is not configured yet.'));
});

it('shows a billing message when no stripe customer is linked for portal action', function () {
    $athlete = User::factory()->athlete()->create([
        'stripe_id' => null,
        'stripe_customer_id' => null,
    ]);

    $this
        ->actingAs($athlete)
        ->get('/settings/overview/billing/portal')
        ->assertRedirect('/settings/overview?tab=billing');

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing')
        ->assertInertia(fn ($page) => $page
            ->where('billingStatusMessage', 'No Stripe customer is linked yet.'));
});
