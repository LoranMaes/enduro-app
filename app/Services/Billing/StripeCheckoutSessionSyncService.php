<?php

namespace App\Services\Billing;

use App\Events\BillingSubscriptionStatusUpdated;
use App\Models\User;
use Illuminate\Support\Str;
use Stripe\Checkout\Session;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class StripeCheckoutSessionSyncService
{
    public function sync(User $user, string $checkoutSessionId): bool
    {
        $normalizedSessionId = trim($checkoutSessionId);

        if ($normalizedSessionId === '') {
            return false;
        }

        $secret = trim((string) config('services.stripe.secret', ''));

        if ($secret === '') {
            return false;
        }

        $stripeClient = new StripeClient($secret);

        try {
            /** @var Session $session */
            $session = $stripeClient->checkout->sessions->retrieve(
                $normalizedSessionId,
                ['expand' => ['subscription']],
            );
        } catch (ApiErrorException) {
            return false;
        }

        if (($session->mode ?? null) !== 'subscription') {
            return false;
        }

        $customerId = trim((string) ($session->customer ?? ''));

        if ($customerId === '') {
            return false;
        }

        $existingStripeId = trim((string) ($user->stripe_id ?? ''));

        if ($existingStripeId !== '' && ! hash_equals($existingStripeId, $customerId)) {
            return false;
        }

        $subscriptionStatus = null;
        $stripeSubscription = $session->subscription;

        if (is_object($stripeSubscription)) {
            $rawStatus = trim((string) ($stripeSubscription->status ?? ''));
            $subscriptionStatus = $rawStatus !== '' ? $rawStatus : null;
        }

        if ($subscriptionStatus === null) {
            $rawStatus = trim((string) ($session->status ?? ''));

            if ($rawStatus !== '') {
                $subscriptionStatus = $rawStatus;
            }
        }

        $normalizedStatus = Str::lower(trim((string) $subscriptionStatus));
        $isSubscribed = in_array($normalizedStatus, ['trialing', 'active', 'past_due'], true);
        $syncedAt = now();

        $user->forceFill([
            'stripe_id' => $customerId,
            'stripe_customer_id' => $customerId,
            'is_subscribed' => $isSubscribed,
            'stripe_subscription_status' => $subscriptionStatus,
            'stripe_subscription_synced_at' => $syncedAt,
        ])->save();

        event(new BillingSubscriptionStatusUpdated(
            userId: (int) $user->id,
            isSubscribed: $isSubscribed,
            subscriptionStatus: $subscriptionStatus,
            syncedAt: $syncedAt->toIso8601String(),
        ));

        return true;
    }
}
