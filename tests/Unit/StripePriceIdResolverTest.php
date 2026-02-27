<?php

use App\Services\Billing\StripePriceIdResolver;

it('returns a price id unchanged when a price id is configured', function () {
    $resolver = app(StripePriceIdResolver::class);

    $resolved = $resolver->resolve('price_123456');

    expect($resolved)->toBe('price_123456');
});

it('returns null for unsupported configured values', function () {
    $resolver = app(StripePriceIdResolver::class);

    $resolved = $resolver->resolve('foo_123456');

    expect($resolved)->toBeNull();
});
