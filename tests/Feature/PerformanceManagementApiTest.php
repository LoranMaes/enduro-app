<?php

use App\Models\TrainingLoadSnapshot;
use App\Models\User;

it('returns combined and per-sport load history series', function () {
    $athlete = User::factory()->athlete()->create();

    TrainingLoadSnapshot::query()->create([
        'user_id' => $athlete->id,
        'date' => '2026-06-10',
        'sport' => 'combined',
        'tss' => 70,
        'atl' => 10,
        'ctl' => 2,
        'tsb' => 0,
    ]);
    TrainingLoadSnapshot::query()->create([
        'user_id' => $athlete->id,
        'date' => '2026-06-11',
        'sport' => 'combined',
        'tss' => 40,
        'atl' => 14.2,
        'ctl' => 2.9,
        'tsb' => -8.0,
    ]);
    TrainingLoadSnapshot::query()->create([
        'user_id' => $athlete->id,
        'date' => '2026-06-10',
        'sport' => 'run',
        'tss' => 70,
        'atl' => 10,
        'ctl' => 2,
        'tsb' => 0,
    ]);

    $response = $this
        ->actingAs($athlete)
        ->getJson('/api/progress?from=2026-06-10&to=2026-06-11')
        ->assertOk()
        ->json();

    expect($response['combined'])->toHaveCount(2);
    expect($response['combined'][0]['date'])->toBe('2026-06-10');
    expect($response['combined'][0]['atl'])->toBe(10);
    expect($response['combined'][1]['ctl'])->toBe(2.9);

    expect($response['per_sport']['run'])->toHaveCount(2);
    expect($response['per_sport']['run'][0]['tss'])->toBe(70);
    expect($response['per_sport']['run'][1]['tss'])->toBe(0);

    expect($response['per_sport']['bike'])->toHaveCount(2);
    expect($response['per_sport']['bike'][0]['tss'])->toBe(0);

    expect($response['latest'])->not->toBeNull();
    expect($response['latest']['date'])->toBe('2026-06-11');
});

it('forbids non-athletes unless impersonating an athlete', function () {
    $admin = User::factory()->admin()->create();
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($admin)
        ->getJson('/api/progress?from=2026-06-10&to=2026-06-11')
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->post("/admin/impersonate/{$athlete->id}")
        ->assertRedirect(route('dashboard'));

    $this
        ->getJson('/api/progress?from=2026-06-10&to=2026-06-11')
        ->assertOk();
});
