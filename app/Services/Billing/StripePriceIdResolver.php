<?php

namespace App\Services\Billing;

use Illuminate\Support\Str;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class StripePriceIdResolver
{
    public function resolve(?string $configuredValue): ?string
    {
        $normalizedValue = trim((string) $configuredValue);

        if ($normalizedValue === '') {
            return null;
        }

        if (Str::startsWith($normalizedValue, 'price_')) {
            return $normalizedValue;
        }

        if (! Str::startsWith($normalizedValue, 'prod_')) {
            return null;
        }

        $secret = trim((string) config('services.stripe.secret', ''));

        if ($secret === '') {
            return null;
        }

        $stripeClient = new StripeClient($secret);

        try {
            $product = $stripeClient->products->retrieve(
                $normalizedValue,
                ['expand' => ['default_price']],
            );
        } catch (ApiErrorException) {
            return null;
        }

        $defaultPrice = $product->default_price ?? null;

        if (is_string($defaultPrice) && Str::startsWith($defaultPrice, 'price_')) {
            return $defaultPrice;
        }

        if (is_object($defaultPrice)) {
            $defaultPriceId = trim((string) ($defaultPrice->id ?? ''));

            if (Str::startsWith($defaultPriceId, 'price_')) {
                return $defaultPriceId;
            }
        }

        try {
            $prices = $stripeClient->prices->all([
                'product' => $normalizedValue,
                'active' => true,
                'limit' => 10,
            ]);
        } catch (ApiErrorException) {
            return null;
        }

        $recurringPriceId = collect($prices->data ?? [])
            ->filter(static fn (mixed $price): bool => is_object($price))
            ->first(function (object $price): bool {
                $priceId = trim((string) ($price->id ?? ''));
                $isRecurring = is_object($price->recurring ?? null);

                return $isRecurring && Str::startsWith($priceId, 'price_');
            });

        if (is_object($recurringPriceId)) {
            return trim((string) ($recurringPriceId->id ?? '')) ?: null;
        }

        $firstPrice = collect($prices->data ?? [])
            ->filter(static fn (mixed $price): bool => is_object($price))
            ->first(function (object $price): bool {
                $priceId = trim((string) ($price->id ?? ''));

                return Str::startsWith($priceId, 'price_');
            });

        if (! is_object($firstPrice)) {
            return null;
        }

        $priceId = trim((string) ($firstPrice->id ?? ''));

        return $priceId !== '' ? $priceId : null;
    }
}
