<?php

use App\Models\User;
use App\Services\Entitlements\SubscriptionFeatureMatrixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function (): void {
    Cache::flush();
    config()->set('subscription-features.definitions', [
        [
            'key' => 'workout.library',
            'group' => 'workout',
            'label' => 'Workout Library',
            'description' => 'Workout templates.',
            'athlete_free_enabled' => false,
            'athlete_free_limit' => 3,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
        [
            'key' => 'progress.range.extended',
            'group' => 'progress',
            'label' => 'Extended Progress Range',
            'description' => 'Progress options greater than 4 weeks.',
            'athlete_free_enabled' => false,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
    ]);
});

it('resolves feature access by user subscription segment', function () {
    $service = app(SubscriptionFeatureMatrixService::class);
    $athleteFree = User::factory()->athlete()->create([
        'is_subscribed' => false,
    ]);
    $athletePaid = User::factory()->athlete()->create([
        'is_subscribed' => true,
    ]);
    $coach = User::factory()->coach()->create([
        'is_subscribed' => false,
    ]);

    expect($service->segmentForUser($athleteFree))->toBe('athlete_free');
    expect($service->segmentForUser($athletePaid))->toBe('athlete_paid');
    expect($service->segmentForUser($coach))->toBe('coach_paid');

    expect($service->enabledFor($athleteFree, 'workout.library'))->toBeFalse();
    expect($service->limitFor($athleteFree, 'workout.library'))->toBe(3);
    expect($service->enabledFor($athletePaid, 'workout.library'))->toBeTrue();
    expect($service->limitFor($athletePaid, 'workout.library'))->toBeNull();
    expect($service->enabledFor($coach, 'workout.library'))->toBeTrue();
});

it('applies admin overrides and flushes cache on update and reset', function () {
    $service = app(SubscriptionFeatureMatrixService::class);
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
    ]);

    expect($service->enabledFor($athlete, 'progress.range.extended'))->toBeFalse();

    $service->updateMany([
        [
            'key' => 'progress.range.extended',
            'athlete_free_enabled' => true,
            'athlete_free_limit' => null,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
    ], $admin);

    expect($service->enabledFor($athlete, 'progress.range.extended'))->toBeTrue();
    expect(collect($service->resolvedDefinitions())
        ->firstWhere('key', 'progress.range.extended')['source'])
        ->toBe('customized');

    $service->resetToDefaults();

    expect($service->enabledFor($athlete, 'progress.range.extended'))->toBeFalse();
    expect(collect($service->resolvedDefinitions())
        ->firstWhere('key', 'progress.range.extended')['source'])
        ->toBe('config_default');
});

it('applies athlete free limit overrides and resets to config defaults', function () {
    $service = app(SubscriptionFeatureMatrixService::class);
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create([
        'is_subscribed' => false,
    ]);

    expect($service->limitFor($athlete, 'workout.library'))->toBe(3);

    $service->updateMany([
        [
            'key' => 'workout.library',
            'athlete_free_enabled' => true,
            'athlete_free_limit' => 8,
            'athlete_paid_enabled' => true,
            'coach_paid_enabled' => true,
        ],
    ], $admin);

    expect($service->limitFor($athlete, 'workout.library'))->toBe(8);

    $service->resetToDefaults();

    expect($service->limitFor($athlete, 'workout.library'))->toBe(3);
});
