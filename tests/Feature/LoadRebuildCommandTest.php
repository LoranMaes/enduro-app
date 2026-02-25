<?php

use App\Jobs\RecalculateUserLoadJob;
use App\Models\User;
use Illuminate\Support\Facades\Bus;

it('requires a target selector for load recompute command', function () {
    $this
        ->artisan('load:recompute')
        ->assertFailed();
});

it('queues recompute for one athlete user', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $athlete = User::factory()->athlete()->create();

    $this
        ->artisan("load:recompute --user={$athlete->id} --from=2026-06-01")
        ->assertSuccessful();

    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athlete)
            && $job->from->toDateString() === '2026-06-01',
    );
});

it('rejects non-athlete user ids', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $admin = User::factory()->admin()->create();

    $this
        ->artisan("load:recompute --user={$admin->id}")
        ->assertFailed();

    Bus::assertNotDispatched(RecalculateUserLoadJob::class);
});

it('queues recompute for all athletes only', function () {
    Bus::fake([RecalculateUserLoadJob::class]);

    $athleteOne = User::factory()->athlete()->create();
    $athleteTwo = User::factory()->athlete()->create();
    User::factory()->coach()->create();
    User::factory()->admin()->create();

    $this
        ->artisan('load:recompute --all --from=2026-05-01')
        ->assertSuccessful();

    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athleteOne),
    );
    Bus::assertDispatched(
        RecalculateUserLoadJob::class,
        fn (RecalculateUserLoadJob $job): bool => $job->user->is($athleteTwo),
    );
    Bus::assertDispatchedTimes(RecalculateUserLoadJob::class, 2);
});
