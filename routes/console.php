<?php

use App\Jobs\ArchiveDoneTicketsJob;
use App\Jobs\RecalculateRecentLoadJob;
use App\Jobs\RecalculateRecentWeeklyMetricsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new ArchiveDoneTicketsJob)
    ->everyFiveMinutes()
    ->withoutOverlapping();

Schedule::job(new RecalculateRecentLoadJob(days: 90, chunkSize: 100))
    ->dailyAt('02:00')
    ->withoutOverlapping();

Schedule::job(new RecalculateRecentWeeklyMetricsJob(days: 90, chunkSize: 100))
    ->dailyAt('02:15')
    ->withoutOverlapping();
