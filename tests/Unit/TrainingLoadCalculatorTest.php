<?php

use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use App\Models\Activity;
use App\Models\TrainingLoadSnapshot;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Load\TrainingLoadCalculator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('calculates atl ctl tsb with per-sport and combined separation', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-03-01',
        'sport' => 'run',
        'status' => TrainingSessionStatus::Planned->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 70,
        'actual_tss' => null,
        'completed_at' => null,
    ]);
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-03-02',
        'sport' => 'bike',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 50,
        'actual_tss' => 42,
        'completed_at' => '2026-03-02 09:00:00',
    ]);
    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-03-03',
        'sport' => 'run',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'planned_tss' => null,
        'actual_tss' => 14,
        'completed_at' => '2026-03-03 10:00:00',
    ]);

    app(TrainingLoadCalculator::class)->recalculateForUser(
        $athlete,
        Carbon::parse('2026-03-01'),
        Carbon::parse('2026-03-03'),
    );

    expect(TrainingLoadSnapshot::query()->count())->toBe(15);

    $dayOneCombined = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-03-01')
        ->where('sport', 'combined')
        ->firstOrFail();
    $dayTwoCombined = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-03-02')
        ->where('sport', 'combined')
        ->firstOrFail();
    $dayThreeCombined = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-03-03')
        ->where('sport', 'combined')
        ->firstOrFail();

    expect(abs($dayOneCombined->tss - 70.0))->toBeLessThan(0.0001);
    expect(abs($dayOneCombined->atl - 10.0))->toBeLessThan(0.0001);
    expect(abs($dayOneCombined->ctl - 1.6666666))->toBeLessThan(0.0001);
    expect(abs($dayOneCombined->tsb - 0.0))->toBeLessThan(0.0001);

    expect(abs($dayTwoCombined->tss - 42.0))->toBeLessThan(0.0001);
    expect(abs($dayTwoCombined->atl - 14.5714285))->toBeLessThan(0.0001);
    expect(abs($dayTwoCombined->ctl - 2.6269841))->toBeLessThan(0.0001);
    expect(abs($dayTwoCombined->tsb - (-8.3333334)))->toBeLessThan(0.0001);

    expect(abs($dayThreeCombined->tss - 14.0))->toBeLessThan(0.0001);
    expect(abs($dayThreeCombined->atl - 14.4897959))->toBeLessThan(0.0001);
    expect(abs($dayThreeCombined->ctl - 2.8972930))->toBeLessThan(0.001);
    expect(abs($dayThreeCombined->tsb - (-11.9444444)))->toBeLessThan(0.0001);

    $dayTwoRun = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-03-02')
        ->where('sport', 'run')
        ->firstOrFail();
    $dayTwoBike = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-03-02')
        ->where('sport', 'bike')
        ->firstOrFail();

    expect(abs($dayTwoRun->tss - 0.0))->toBeLessThan(0.0001);
    expect(abs($dayTwoBike->tss - 42.0))->toBeLessThan(0.0001);
});

it('is idempotent when recalculating the same window repeatedly', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-04-10',
        'sport' => 'swim',
        'status' => TrainingSessionStatus::Planned->value,
        'planning_source' => TrainingSessionPlanningSource::Planned->value,
        'planned_tss' => 55,
        'actual_tss' => null,
        'completed_at' => null,
    ]);

    $calculator = app(TrainingLoadCalculator::class);
    $from = Carbon::parse('2026-04-10');
    $to = Carbon::parse('2026-04-11');

    $calculator->recalculateForUser($athlete, $from, $to);
    $firstPass = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->orderBy('date')
        ->orderBy('sport')
        ->get()
        ->map(fn (TrainingLoadSnapshot $snapshot) => [
            'date' => $snapshot->date?->toDateString(),
            'sport' => $snapshot->sport,
            'tss' => $snapshot->tss,
            'atl' => $snapshot->atl,
            'ctl' => $snapshot->ctl,
            'tsb' => $snapshot->tsb,
        ])
        ->all();

    $calculator->recalculateForUser($athlete, $from, $to);
    $secondPass = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->orderBy('date')
        ->orderBy('sport')
        ->get()
        ->map(fn (TrainingLoadSnapshot $snapshot) => [
            'date' => $snapshot->date?->toDateString(),
            'sport' => $snapshot->sport,
            'tss' => $snapshot->tss,
            'atl' => $snapshot->atl,
            'ctl' => $snapshot->ctl,
            'tsb' => $snapshot->tsb,
        ])
        ->all();

    expect($firstPass)->toBe($secondPass);
    expect(TrainingLoadSnapshot::query()->count())->toBe(10);
});

it('uses resolved activity tss for completed sessions when actual tss is missing', function () {
    $athlete = User::factory()->athlete()->create();

    $session = TrainingSession::factory()->create([
        'user_id' => $athlete->id,
        'training_week_id' => null,
        'scheduled_date' => '2026-05-10',
        'sport' => 'run',
        'status' => TrainingSessionStatus::Completed->value,
        'planning_source' => TrainingSessionPlanningSource::Unplanned->value,
        'planned_tss' => null,
        'actual_tss' => null,
        'completed_at' => '2026-05-10 10:00:00',
    ]);

    Activity::factory()->linkedToTrainingSession($session)->create([
        'athlete_id' => $athlete->id,
        'sport' => 'run',
        'started_at' => '2026-05-10 09:00:00',
        'duration_seconds' => 3600,
        'raw_payload' => [
            'relative_effort' => 88,
        ],
    ]);

    app(TrainingLoadCalculator::class)->recalculateForUser(
        $athlete,
        Carbon::parse('2026-05-10'),
        Carbon::parse('2026-05-10'),
    );

    $snapshot = TrainingLoadSnapshot::query()
        ->where('user_id', $athlete->id)
        ->whereDate('date', '2026-05-10')
        ->where('sport', 'combined')
        ->firstOrFail();

    expect($snapshot->tss)->toBe(88.0);
});
