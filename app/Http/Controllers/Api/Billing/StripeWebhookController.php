<?php

namespace App\Http\Controllers\Api\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Billing\StripeWebhookRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StripeWebhookController extends Controller
{
    public function __invoke(StripeWebhookRequest $request): JsonResponse
    {
        if (! $this->hasValidStripeSignature($request)) {
            return response()->json([
                'message' => 'Invalid webhook signature.',
            ], 400);
        }

        $validated = $request->validated();
        $payloadType = (string) $validated['type'];
        /** @var array<string, mixed> $object */
        $object = $validated['data']['object'];
        $customerId = trim((string) ($object['customer'] ?? ''));

        if ($customerId === '') {
            return response()->json(['received' => true]);
        }

        $subscriptionStatus = trim((string) ($object['status'] ?? ''));
        $normalizedStatus = strtolower($subscriptionStatus);
        $isSubscribed = in_array(
            $normalizedStatus,
            ['trialing', 'active', 'past_due'],
            true,
        );

        if (
            in_array(
                $payloadType,
                [
                    'customer.subscription.created',
                    'customer.subscription.updated',
                    'customer.subscription.deleted',
                ],
                true,
            )
        ) {
            User::query()
                ->where('stripe_customer_id', $customerId)
                ->update([
                    'is_subscribed' => $isSubscribed,
                    'stripe_subscription_status' => $subscriptionStatus !== ''
                        ? $subscriptionStatus
                        : null,
                    'stripe_subscription_synced_at' => now(),
                ]);
        }

        return response()->json(['received' => true]);
    }

    private function hasValidStripeSignature(StripeWebhookRequest $request): bool
    {
        $webhookSecret = trim((string) config('services.stripe.webhook_secret'));

        if ($webhookSecret === '') {
            return true;
        }

        $signatureHeader = trim((string) $request->header('Stripe-Signature', ''));

        if ($signatureHeader === '') {
            return false;
        }

        $signaturePairs = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function (string $segment): array {
                [$key, $value] = array_pad(explode('=', trim($segment), 2), 2, '');

                return [trim($key) => trim($value)];
            });
        $timestamp = (string) $signaturePairs->get('t', '');
        $providedSignature = (string) $signaturePairs->get('v1', '');

        if ($timestamp === '' || $providedSignature === '') {
            return false;
        }

        $payload = (string) $request->getContent();
        $signedPayload = "{$timestamp}.{$payload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $webhookSecret);

        return hash_equals($expectedSignature, $providedSignature);
    }
}
