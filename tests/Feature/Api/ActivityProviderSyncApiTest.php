<?php

use App\Events\ActivityProviderSyncStatusUpdated;
use App\Jobs\SyncActivityProviderJob;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderSyncRun;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

it('requires authentication for activity provider sync endpoint', function () {
    $this
        ->postJson('/api/activity-providers/strava/sync')
        ->assertUnauthorized();
});

it('requires an existing provider connection before syncing', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertUnprocessable()
        ->assertJsonPath(
            'message',
            'Activity provider [strava] access token is missing for this user.',
        );
});

it('queues a sync job for connected athletes', function () {
    Queue::fake();
    Event::fake([ActivityProviderSyncStatusUpdated::class]);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $response = $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/strava/sync');

    $response
        ->assertStatus(202)
        ->assertJsonPath('provider', 'strava')
        ->assertJsonPath('status', 'queued');

    expect($response->json('sync_run_id'))->toBeInt();

    Queue::assertPushed(SyncActivityProviderJob::class, function (SyncActivityProviderJob $job) use ($athlete): bool {
        return $job->provider === 'strava'
            && $job->userId === $athlete->id
            && $job->syncRunId !== null;
    });

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->last_sync_status)->toBe('queued');

    Event::assertDispatched(
        ActivityProviderSyncStatusUpdated::class,
        fn (ActivityProviderSyncStatusUpdated $event): bool => $event->userId === $athlete->id
            && $event->provider === 'strava'
            && $event->status === 'queued',
    );

    $syncRun = ActivityProviderSyncRun::query()->find($response->json('sync_run_id'));

    expect($syncRun)->not->toBeNull();
    expect($syncRun?->status)->toBe(ActivityProviderSyncRun::STATUS_QUEUED);
});

it('allows admins to queue activity sync for their connected account', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $admin->id,
        'provider' => 'strava',
        'access_token' => 'admin-access-token',
        'refresh_token' => 'admin-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $this
        ->actingAs($admin)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertStatus(202)
        ->assertJsonPath('provider', 'strava')
        ->assertJsonPath('status', 'queued');

    Queue::assertPushed(SyncActivityProviderJob::class, 1);
});

it('forbids coaches from syncing activity providers', function () {
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($coach)
        ->postJson('/api/activity-providers/strava/sync')
        ->assertForbidden();
});

it('rejects unsupported providers', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->postJson('/api/activity-providers/garmin/sync')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['provider']);
});
