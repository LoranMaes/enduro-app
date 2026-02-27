<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BillingSubscriptionStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly bool $isSubscribed,
        public readonly ?string $subscriptionStatus,
        public readonly ?string $syncedAt,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("App.Models.User.{$this->userId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'billing.subscription-status-updated';
    }

    /**
     * @return array{
     *     user_id: int,
     *     is_subscribed: bool,
     *     subscription_status: string|null,
     *     synced_at: string|null
     * }
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'is_subscribed' => $this->isSubscribed,
            'subscription_status' => $this->subscriptionStatus,
            'synced_at' => $this->syncedAt,
        ];
    }
}
