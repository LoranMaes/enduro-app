<?php

use App\Data\Collections\ActivityCollection;
use App\Data\ExternalActivityDTO;
use App\Jobs\RecalculateUserLoadJob;
use App\Jobs\RecalculateWeeklyMetricsJob;
use App\Jobs\StravaFullHistoryImportJob;
use App\Models\Activity;
use App\Models\User;
use App\Services\Activities\ExternalActivityPersister;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Contracts\ActivityProvider;
use App\Services\Training\ActivityToSessionReconciler;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Queue;

afterEach(function (): void {
    \Mockery::close();
});

it('reconciles imported activities and dispatches one load recomputation from the earliest imported day', function () {
    Queue::fake();

    $athlete = User::factory()->athlete()->create();
    $job = new StravaFullHistoryImportJob($athlete, perPage: 1);

    $providerManager = \Mockery::mock(ActivityProviderManager::class);
    $provider = \Mockery::mock(ActivityProvider::class);
    $persister = \Mockery::mock(ExternalActivityPersister::class);
    $reconciler = \Mockery::mock(ActivityToSessionReconciler::class);

    $firstBatch = new ActivityCollection([
        new ExternalActivityDTO(
            provider: 'strava',
            external_id: '10001',
            sport: 'run',
            started_at: CarbonImmutable::parse('2025-12-01 09:00:00'),
            duration_seconds: 1800,
        ),
    ]);

    $persistedActivities = new EloquentCollection([
        Activity::factory()->make([
            'athlete_id' => $athlete->id,
            'started_at' => CarbonImmutable::parse('2025-12-01 09:00:00'),
        ]),
    ]);

    $providerManager->shouldReceive('provider')
        ->once()
        ->with('strava')
        ->andReturn($provider);

    $provider->shouldReceive('fetchActivities')
        ->twice()
        ->andReturn(
            $firstBatch,
            new ActivityCollection,
        );

    $persister->shouldReceive('persistMany')
        ->once()
        ->withArgs(function (User $user, ActivityCollection $activities) use ($athlete, $firstBatch): bool {
            return $user->is($athlete) && $activities === $firstBatch;
        })
        ->andReturn($persistedActivities);

    $reconciler->shouldReceive('reconcileMany')
        ->once()
        ->with($persistedActivities);

    $job->handle($providerManager, $persister, $reconciler);

    Queue::assertPushed(RecalculateUserLoadJob::class, function (RecalculateUserLoadJob $queuedJob) use ($athlete): bool {
        return $queuedJob->user->is($athlete)
            && $queuedJob->from->toDateString() === '2025-12-01';
    });

    Queue::assertPushed(RecalculateWeeklyMetricsJob::class, function (RecalculateWeeklyMetricsJob $queuedJob) use ($athlete): bool {
        return $queuedJob->user->is($athlete)
            && $queuedJob->from->toDateString() === '2025-12-01';
    });

    Queue::assertPushed(RecalculateUserLoadJob::class, 1);
    Queue::assertPushed(RecalculateWeeklyMetricsJob::class, 1);
});

it('does not dispatch recomputation jobs when no activities are imported', function () {
    Queue::fake();

    $athlete = User::factory()->athlete()->create();
    $job = new StravaFullHistoryImportJob($athlete, perPage: 2);

    $providerManager = \Mockery::mock(ActivityProviderManager::class);
    $provider = \Mockery::mock(ActivityProvider::class);
    $persister = \Mockery::mock(ExternalActivityPersister::class);
    $reconciler = \Mockery::mock(ActivityToSessionReconciler::class);

    $providerManager->shouldReceive('provider')
        ->once()
        ->with('strava')
        ->andReturn($provider);

    $provider->shouldReceive('fetchActivities')
        ->once()
        ->andReturn(new ActivityCollection);

    $persister->shouldNotReceive('persistMany');
    $reconciler->shouldNotReceive('reconcileMany');

    $job->handle($providerManager, $persister, $reconciler);

    Queue::assertNotPushed(RecalculateUserLoadJob::class);
    Queue::assertNotPushed(RecalculateWeeklyMetricsJob::class);
});
