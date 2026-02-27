<?php

use App\Models\User;
use App\Services\Billing\StripeCheckoutSessionSyncService;
use App\Services\Billing\StripePriceIdResolver;

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

it('shows a billing message when configured price value can not be resolved', function () {
    config()->set('services.stripe.default_price_id', 'prod_invalid');

    $mock = $this->mock(StripePriceIdResolver::class);
    $mock->shouldReceive('resolve')
        ->once()
        ->with('prod_invalid')
        ->andReturn(null);

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

it('resolves the configured plan price value when a plan key is provided', function () {
    config()->set('services.stripe.price_plans', [
        'core' => 'price_core_123',
        'advanced' => 'price_advanced_123',
    ]);

    $mock = $this->mock(StripePriceIdResolver::class);
    $mock->shouldReceive('resolve')
        ->once()
        ->with('price_advanced_123')
        ->andReturn(null);

    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/overview/billing/subscribe?plan=advanced')
        ->assertRedirect('/settings/overview?tab=billing');
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

it('shows a billing message when checkout is canceled', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing&checkout=cancel')
        ->assertRedirect('/settings/overview?tab=billing');

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing')
        ->assertInertia(fn ($page) => $page
            ->where('billingStatusMessage', 'Checkout was canceled. No charges were made.'));
});

it('syncs subscription when returning from a successful checkout session', function () {
    $athlete = User::factory()->athlete()->create();

    $mock = $this->mock(StripeCheckoutSessionSyncService::class);
    $mock->shouldReceive('sync')
        ->once()
        ->withArgs(function (User $user, string $sessionId) use ($athlete): bool {
            return $user->is($athlete) && $sessionId === 'cs_test_123';
        })
        ->andReturn(true);

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing&checkout=success&session_id=cs_test_123')
        ->assertRedirect('/settings/overview?tab=billing');

    $this
        ->actingAs($athlete)
        ->get('/settings/overview?tab=billing')
        ->assertInertia(fn ($page) => $page
            ->where('billingStatusMessage', 'Subscription activated successfully.'));
});
