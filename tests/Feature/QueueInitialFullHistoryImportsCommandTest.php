<?php

use App\Jobs\StravaFullHistoryImportJob;
use App\Models\ActivityProviderConnection;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

it('queues initial full-history imports for eligible athlete connections', function () {
    Queue::fake();

    config()->set('services.activity_providers.initial_full_import_enabled', true);

    $athlete = User::factory()->athlete()->create();
    $coach = User::factory()->coach()->create();
    $alreadySyncedAthlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'access-token-1',
        'refresh_token' => 'refresh-token-1',
        'token_expires_at' => now()->addHour(),
    ]);

    ActivityProviderConnection::query()->create([
        'user_id' => $coach->id,
        'provider' => 'strava',
        'access_token' => 'access-token-2',
        'refresh_token' => 'refresh-token-2',
        'token_expires_at' => now()->addHour(),
    ]);

    ActivityProviderConnection::query()->create([
        'user_id' => $alreadySyncedAthlete->id,
        'provider' => 'strava',
        'access_token' => 'access-token-3',
        'refresh_token' => 'refresh-token-3',
        'token_expires_at' => now()->addHour(),
        'last_synced_at' => now()->subMinute(),
    ]);

    $this->artisan('activity-providers:queue-initial-full-history-import')
        ->assertSuccessful();

    Queue::assertPushed(StravaFullHistoryImportJob::class, function (StravaFullHistoryImportJob $job) use ($athlete): bool {
        return (int) $job->user->id === (int) $athlete->id;
    });
    Queue::assertPushed(StravaFullHistoryImportJob::class, 1);

    $queuedConnection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($queuedConnection)->not->toBeNull();
    expect($queuedConnection?->initial_full_import_requested_at)->not->toBeNull();

    $coachConnection = ActivityProviderConnection::query()
        ->where('user_id', $coach->id)
        ->where('provider', 'strava')
        ->first();

    expect($coachConnection)->not->toBeNull();
    expect($coachConnection?->initial_full_import_requested_at)->toBeNull();
});

it('supports dry-run mode without dispatching jobs', function () {
    Queue::fake();

    config()->set('services.activity_providers.initial_full_import_enabled', true);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'access-token-1',
        'refresh_token' => 'refresh-token-1',
        'token_expires_at' => now()->addHour(),
    ]);

    $this->artisan('activity-providers:queue-initial-full-history-import', [
        '--dry-run' => true,
    ])->assertSuccessful();

    Queue::assertNothingPushed();

    $connection = ActivityProviderConnection::query()
        ->where('user_id', $athlete->id)
        ->where('provider', 'strava')
        ->first();

    expect($connection)->not->toBeNull();
    expect($connection?->initial_full_import_requested_at)->toBeNull();
});

it('queues full-history imports for already-synced athletes when forced', function () {
    Queue::fake();

    config()->set('services.activity_providers.initial_full_import_enabled', false);

    $athlete = User::factory()->athlete()->create();

    ActivityProviderConnection::query()->create([
        'user_id' => $athlete->id,
        'provider' => 'strava',
        'access_token' => 'access-token-1',
        'refresh_token' => 'refresh-token-1',
        'token_expires_at' => now()->addHour(),
        'last_synced_at' => now()->subHour(),
        'initial_full_import_requested_at' => now()->subHour(),
    ]);

    $this->artisan('activity-providers:queue-initial-full-history-import', [
        '--user' => [$athlete->id],
        '--force' => true,
    ])->assertSuccessful();

    Queue::assertPushed(StravaFullHistoryImportJob::class, function (StravaFullHistoryImportJob $job) use ($athlete): bool {
        return (int) $job->user->id === (int) $athlete->id;
    });
});
