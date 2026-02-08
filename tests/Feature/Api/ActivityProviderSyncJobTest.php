<?php

use App\Data\ActivityProviderSyncResultDTO;
use App\Events\ActivityProviderSyncStatusUpdated;
use App\Jobs\SyncActivityProviderJob;
use App\Models\ActivityProviderConnection;
use App\Models\ActivityProviderSyncRun;
use App\Models\User;
use App\Services\Activities\ActivitySyncService;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRateLimitedException;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\Job as QueueJobContract;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;

afterEach(function (): void {
    \Mockery::close();
});

it('does not execute a sync when another sync lock is active for the same user and provider', function () {
    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $syncRun = ActivityProviderSyncRun::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'status' => ActivityProviderSyncRun::STATUS_QUEUED,
        'queued_at' => now(),
    ]);

    $lock = Cache::lock("activity-sync:strava:{$athlete->id}", 300);
    expect($lock->get())->toBeTrue();

    $activitySyncService = \Mockery::mock(ActivitySyncService::class);
    $activitySyncService->shouldNotReceive('sync');

    $job = new SyncActivityProviderJob(
        provider: 'strava',
        userId: $athlete->id,
        syncRunId: $syncRun->id,
    );

    $job->handle(
        activitySyncService: $activitySyncService,
        connectionStore: app(ActivityProviderConnectionStore::class),
    );

    $syncRun->refresh();
    expect($syncRun->status)->toBe(ActivityProviderSyncRun::STATUS_QUEUED);

    $lock->release();
});

it('marks sync as rate limited and requeues with the provider retry-after delay', function () {
    Event::fake([ActivityProviderSyncStatusUpdated::class]);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
        'last_sync_status' => 'queued',
    ]);

    $syncRun = ActivityProviderSyncRun::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'status' => ActivityProviderSyncRun::STATUS_QUEUED,
        'queued_at' => now(),
    ]);

    $activitySyncService = \Mockery::mock(ActivitySyncService::class);
    $activitySyncService->shouldReceive('sync')
        ->once()
        ->andThrow(new ActivityProviderRateLimitedException(
            provider: 'strava',
            message: 'Retry later.',
            retryAfterSeconds: 120,
        ));

    $queueJob = \Mockery::mock(QueueJobContract::class);
    $queueJob->shouldReceive('release')->once()->with(120);

    $job = new SyncActivityProviderJob(
        provider: 'strava',
        userId: $athlete->id,
        syncRunId: $syncRun->id,
    );
    $job->setJob($queueJob);

    $job->handle(
        activitySyncService: $activitySyncService,
        connectionStore: app(ActivityProviderConnectionStore::class),
    );

    $syncRun->refresh();
    expect($syncRun->status)->toBe(ActivityProviderSyncRun::STATUS_RATE_LIMITED);
    expect((string) $syncRun->reason)->toContain('Retry after 120 seconds.');

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->last_sync_status)->toBe('rate_limited');
    expect((string) $connection?->last_sync_reason)->toContain('Retry after 120 seconds.');

    Event::assertDispatched(
        ActivityProviderSyncStatusUpdated::class,
        fn (ActivityProviderSyncStatusUpdated $event): bool => $event->userId === $athlete->id
            && $event->provider === 'strava'
            && $event->status === 'rate_limited',
    );
});

it('marks sync run and connection as successful when the job completes', function () {
    Event::fake([ActivityProviderSyncStatusUpdated::class]);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'valid-access-token',
        'refresh_token' => 'valid-refresh-token',
        'token_expires_at' => now()->addHour(),
    ]);

    $syncRun = ActivityProviderSyncRun::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'status' => ActivityProviderSyncRun::STATUS_QUEUED,
        'queued_at' => now(),
    ]);

    $syncedAt = CarbonImmutable::now();

    $activitySyncService = \Mockery::mock(ActivitySyncService::class);
    $activitySyncService->shouldReceive('sync')
        ->once()
        ->andReturn(new ActivityProviderSyncResultDTO(
            provider: 'strava',
            syncedActivitiesCount: 3,
            syncedAt: $syncedAt,
            status: 'success',
        ));

    $job = new SyncActivityProviderJob(
        provider: 'strava',
        userId: $athlete->id,
        syncRunId: $syncRun->id,
    );

    $job->handle(
        activitySyncService: $activitySyncService,
        connectionStore: app(ActivityProviderConnectionStore::class),
    );

    $syncRun->refresh();
    expect($syncRun->status)->toBe(ActivityProviderSyncRun::STATUS_SUCCESS);
    expect($syncRun->imported_count)->toBe(3);
    expect($syncRun->finished_at)->not->toBeNull();

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->last_sync_status)->toBe('success');
    expect($connection?->last_synced_at)->not->toBeNull();

    Event::assertDispatched(
        ActivityProviderSyncStatusUpdated::class,
        fn (ActivityProviderSyncStatusUpdated $event): bool => $event->userId === $athlete->id
            && $event->provider === 'strava'
            && $event->status === 'running',
    );

    Event::assertDispatched(
        ActivityProviderSyncStatusUpdated::class,
        fn (ActivityProviderSyncStatusUpdated $event): bool => $event->userId === $athlete->id
            && $event->provider === 'strava'
            && $event->status === 'success',
    );
});
