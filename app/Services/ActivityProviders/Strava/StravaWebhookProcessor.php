<?php

namespace App\Services\ActivityProviders\Strava;

use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderWebhookEvent;
use App\Services\Activities\ActivitySyncDispatcher;
use Carbon\CarbonImmutable;
use JsonException;
use Throwable;

class StravaWebhookProcessor
{
    private const PROVIDER = 'strava';

    public function __construct(
        private readonly ActivitySyncDispatcher $activitySyncDispatcher,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function process(array $payload): ActivityProviderWebhookEvent
    {
        $webhookEvent = ActivityProviderWebhookEvent::query()->firstOrCreate(
            [
                'provider' => self::PROVIDER,
                'payload_hash' => $this->payloadHash($payload),
            ],
            [
                'external_event_id' => $this->resolveExternalEventId($payload),
                'object_type' => $this->stringValue($payload['object_type'] ?? null),
                'object_id' => $this->stringValue($payload['object_id'] ?? null),
                'aspect_type' => $this->stringValue($payload['aspect_type'] ?? null),
                'owner_id' => $this->stringValue($payload['owner_id'] ?? null),
                'status' => 'received',
                'payload' => $payload,
                'received_at' => CarbonImmutable::now(),
            ],
        );

        if (! $webhookEvent->wasRecentlyCreated) {
            return $webhookEvent;
        }

        try {
            if (! $this->matchesConfiguredSubscription($payload)) {
                return $this->markIgnored(
                    $webhookEvent,
                    'Webhook payload subscription id does not match configured subscription.',
                );
            }

            $objectType = strtolower((string) ($webhookEvent->object_type ?? ''));
            $aspectType = strtolower((string) ($webhookEvent->aspect_type ?? ''));
            $objectId = $webhookEvent->object_id;
            $ownerId = $webhookEvent->owner_id;

            if ($objectType !== 'activity') {
                return $this->markIgnored(
                    $webhookEvent,
                    'Webhook object type is not supported.',
                );
            }

            if ($ownerId === null) {
                return $this->markIgnored(
                    $webhookEvent,
                    'Webhook payload does not include owner id.',
                );
            }

            $connection = ActivityProviderConnection::query()
                ->with('user')
                ->where('provider', self::PROVIDER)
                ->where('provider_athlete_id', $ownerId)
                ->first();

            if (! $connection instanceof ActivityProviderConnection || $connection->user === null) {
                return $this->markIgnored(
                    $webhookEvent,
                    'No local user is connected for the webhook owner id.',
                );
            }

            if ($aspectType === 'delete') {
                if ($objectId !== null) {
                    Activity::query()
                        ->where('provider', self::PROVIDER)
                        ->where('athlete_id', $connection->user_id)
                        ->where('external_id', $objectId)
                        ->delete();
                }

                return $this->markProcessed($webhookEvent);
            }

            if (in_array($aspectType, ['create', 'update'], true)) {
                if ($objectId === null) {
                    return $this->markIgnored(
                        $webhookEvent,
                        'Webhook payload does not include activity id.',
                    );
                }

                $this->activitySyncDispatcher->dispatch(
                    user: $connection->user,
                    provider: self::PROVIDER,
                    options: [
                        'external_activity_id' => $objectId,
                    ],
                );

                return $this->markProcessed($webhookEvent);
            }

            return $this->markIgnored($webhookEvent, 'Webhook aspect type is not handled.');
        } catch (Throwable $throwable) {
            $webhookEvent->forceFill([
                'status' => 'failed',
                'reason' => $throwable->getMessage(),
                'processed_at' => CarbonImmutable::now(),
            ])->save();

            return $webhookEvent;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function payloadHash(array $payload): string
    {
        try {
            return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return hash('sha256', serialize($payload));
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveExternalEventId(array $payload): ?string
    {
        $subscriptionId = $this->stringValue($payload['subscription_id'] ?? null);
        $eventTime = $this->stringValue($payload['event_time'] ?? null);
        $objectType = $this->stringValue($payload['object_type'] ?? null);
        $objectId = $this->stringValue($payload['object_id'] ?? null);
        $aspectType = $this->stringValue($payload['aspect_type'] ?? null);
        $ownerId = $this->stringValue($payload['owner_id'] ?? null);

        $parts = array_filter([
            $subscriptionId,
            $eventTime,
            $objectType,
            $objectId,
            $aspectType,
            $ownerId,
        ], static fn (?string $value): bool => $value !== null && $value !== '');

        if ($parts === []) {
            return null;
        }

        return implode(':', $parts);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function matchesConfiguredSubscription(array $payload): bool
    {
        $configuredSubscriptionId = trim((string) config('services.strava.webhook_subscription_id', ''));

        if ($configuredSubscriptionId === '') {
            return true;
        }

        $subscriptionId = $this->stringValue($payload['subscription_id'] ?? null);

        if ($subscriptionId === null) {
            return false;
        }

        return hash_equals($configuredSubscriptionId, $subscriptionId);
    }

    private function markProcessed(ActivityProviderWebhookEvent $event): ActivityProviderWebhookEvent
    {
        $event->forceFill([
            'status' => 'processed',
            'reason' => null,
            'processed_at' => CarbonImmutable::now(),
        ])->save();

        return $event;
    }

    private function markIgnored(
        ActivityProviderWebhookEvent $event,
        string $reason,
    ): ActivityProviderWebhookEvent {
        $event->forceFill([
            'status' => 'ignored',
            'reason' => $reason,
            'processed_at' => CarbonImmutable::now(),
        ])->save();

        return $event;
    }

    private function stringValue(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $stringValue = trim((string) $value);

        if ($stringValue === '') {
            return null;
        }

        return $stringValue;
    }
}
