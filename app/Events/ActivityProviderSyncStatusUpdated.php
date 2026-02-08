<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityProviderSyncStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly string $provider,
        public readonly string $status,
        public readonly ?string $reason = null,
        public readonly ?string $syncedAt = null,
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
        return 'activity-provider.sync-status-updated';
    }

    /**
     * @return array{
     *     user_id: int,
     *     provider: string,
     *     status: string,
     *     reason: string|null,
     *     synced_at: string|null
     * }
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'provider' => $this->provider,
            'status' => $this->status,
            'reason' => $this->reason,
            'synced_at' => $this->syncedAt,
        ];
    }
}
