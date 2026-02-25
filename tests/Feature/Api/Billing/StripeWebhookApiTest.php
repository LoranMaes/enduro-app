<?php

use App\Models\User;

it('updates subscription fields for a valid stripe webhook payload', function () {
    config()->set('services.stripe.webhook_secret', 'whsec_test_secret');

    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_customer_id' => 'cus_123',
        'stripe_subscription_status' => null,
        'stripe_subscription_synced_at' => null,
    ]);
    $payload = [
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_123',
                'status' => 'active',
            ],
        ],
    ];
    $payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = (string) time();
    $signature = hash_hmac(
        'sha256',
        "{$timestamp}.{$payloadJson}",
        'whsec_test_secret',
    );

    $response = $this->call(
        'POST',
        '/api/webhooks/stripe',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
        ],
        $payloadJson,
    );

    $response->assertOk()
        ->assertJson(['received' => true]);

    $athlete->refresh();

    expect($athlete->is_subscribed)->toBeTrue();
    expect($athlete->stripe_subscription_status)->toBe('active');
    expect($athlete->stripe_subscription_synced_at)->not->toBeNull();
});

it('rejects invalid stripe webhook signatures', function () {
    config()->set('services.stripe.webhook_secret', 'whsec_test_secret');

    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
        'stripe_customer_id' => 'cus_987',
    ]);

    $payloadJson = json_encode([
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_987',
                'status' => 'active',
            ],
        ],
    ], JSON_THROW_ON_ERROR);

    $response = $this->call(
        'POST',
        '/api/webhooks/stripe',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => 't=123,v1=bad-signature',
        ],
        $payloadJson,
    );

    $response
        ->assertStatus(400)
        ->assertJson(['message' => 'Invalid webhook signature.']);

    expect($athlete->fresh()?->is_subscribed)->toBeFalse();
});
