<?php

it('accepts cashier stripe webhook requests without csrf token', function () {
    config()->set('cashier.webhook.secret', null);

    $payload = json_encode([
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test',
                'status' => 'active',
                'id' => 'sub_test',
                'items' => [
                    'data' => [
                        [
                            'id' => 'si_test',
                            'price' => [
                                'id' => 'price_test',
                                'product' => 'prod_test',
                            ],
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ],
    ], JSON_THROW_ON_ERROR);

    $this->call(
        'POST',
        '/stripe/webhook',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload,
    )->assertOk();
});
