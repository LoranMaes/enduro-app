<?php

use App\Jobs\SyncActivityProviderJob;
use App\Models\Activity;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderWebhookEvent;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('verifies the strava webhook subscription challenge', function () {
    config()->set('services.strava.webhook_verify_token', 'verify-token-123');

    $this
        ->getJson('/api/webhooks/strava?hub.mode=subscribe&hub.verify_token=verify-token-123&hub.challenge=challenge-abc')
        ->assertSuccessful()
        ->assertJsonFragment(['hub.challenge' => 'challenge-abc']);
});

it('rejects invalid strava webhook verification requests', function () {
    config()->set('services.strava.webhook_verify_token', 'verify-token-123');

    $this
        ->getJson('/api/webhooks/strava?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge-abc')
        ->assertForbidden();
});

it('stores webhook events idempotently and dispatches sync for create updates', function () {
    Queue::fake();

    config()->set('services.strava.webhook_subscription_id', '99');

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
        'provider_athlete_id' => '12345',
    ]);

    $payload = [
        'object_type' => 'activity',
        'object_id' => 778899,
        'aspect_type' => 'create',
        'owner_id' => 12345,
        'subscription_id' => 99,
        'event_time' => now()->timestamp,
    ];

    $this
        ->postJson('/api/webhooks/strava', $payload)
        ->assertSuccessful()
        ->assertJsonPath('status', 'accepted')
        ->assertJsonPath('event_status', 'processed');

    $this
        ->postJson('/api/webhooks/strava', $payload)
        ->assertSuccessful()
        ->assertJsonPath('status', 'accepted')
        ->assertJsonPath('event_status', 'processed');

    Queue::assertPushed(SyncActivityProviderJob::class, 1);
    Queue::assertPushed(SyncActivityProviderJob::class, function (SyncActivityProviderJob $job) use ($athlete): bool {
        return $job->provider === 'strava'
            && $job->userId === $athlete->id
            && $job->externalActivityId === '778899';
    });

    expect(ActivityProviderWebhookEvent::query()->count())->toBe(1);

    $event = ActivityProviderWebhookEvent::query()->first();
    expect($event)->not->toBeNull();
    expect($event?->status)->toBe('processed');
});

it('soft deletes matching activities on strava delete webhook events', function () {
    Queue::fake();

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
        'provider_athlete_id' => '456',
    ]);

    $activity = Activity::factory()->create([
        'athlete_id' => $athlete->id,
        'provider' => 'strava',
        'external_id' => '1234567',
    ]);

    $payload = [
        'object_type' => 'activity',
        'object_id' => 1234567,
        'aspect_type' => 'delete',
        'owner_id' => 456,
        'event_time' => now()->timestamp,
    ];

    $this
        ->postJson('/api/webhooks/strava', $payload)
        ->assertSuccessful()
        ->assertJsonPath('status', 'accepted')
        ->assertJsonPath('event_status', 'processed');

    $activity->refresh();
    expect($activity->trashed())->toBeTrue();

    Queue::assertNothingPushed();
});
