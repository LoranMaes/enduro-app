<?php

use App\Jobs\RecalculateUserLoadJob;
use App\Jobs\RecalculateWeeklyMetricsJob;
use App\Models\User;
use Carbon\Carbon;

it('builds a stable unique identifier for user load recalculation jobs', function () {
    $athlete = User::factory()->athlete()->create();
    $job = new RecalculateUserLoadJob(
        $athlete,
        Carbon::parse('2026-03-01 08:15:00'),
        Carbon::parse('2026-03-31 19:25:00'),
    );

    expect($job->uniqueFor)->toBe(300);
    expect($job->uniqueId())->toBe(
        "recalculate-user-load:{$athlete->id}:2026-03-01:2026-03-31",
    );
});

it('builds a stable unique identifier for weekly metrics recalculation jobs', function () {
    $athlete = User::factory()->athlete()->create();
    $job = new RecalculateWeeklyMetricsJob(
        $athlete,
        Carbon::parse('2026-03-01 08:15:00'),
        Carbon::parse('2026-03-31 19:25:00'),
    );

    expect($job->uniqueFor)->toBe(300);
    expect($job->uniqueId())->toBe(
        "recalculate-weekly-metrics:{$athlete->id}:2026-03-01:2026-03-31",
    );
});

