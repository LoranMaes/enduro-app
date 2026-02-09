<?php

use App\Models\User;

it('allows athletes to update training preferences with performance anchors and zones', function () {
    $athlete = User::factory()->athlete()->create();

    $payload = [
        'primary_sport' => 'bike',
        'weekly_training_days' => 5,
        'preferred_rest_day' => 'friday',
        'intensity_distribution' => 'pyramidal',
        'ftp_watts' => 320,
        'max_heart_rate_bpm' => 192,
        'threshold_heart_rate_bpm' => 176,
        'threshold_pace_minutes_per_km' => 238,
        'power_zones' => [
            ['label' => 'Z1', 'min' => 55, 'max' => 75],
            ['label' => 'Z2', 'min' => 76, 'max' => 90],
            ['label' => 'Z3', 'min' => 91, 'max' => 105],
            ['label' => 'Z4', 'min' => 106, 'max' => 120],
            ['label' => 'Z5', 'min' => 121, 'max' => 150],
        ],
        'heart_rate_zones' => [
            ['label' => 'Z1', 'min' => 60, 'max' => 72],
            ['label' => 'Z2', 'min' => 73, 'max' => 82],
            ['label' => 'Z3', 'min' => 83, 'max' => 89],
            ['label' => 'Z4', 'min' => 90, 'max' => 95],
            ['label' => 'Z5', 'min' => 96, 'max' => 100],
        ],
    ];

    $this
        ->actingAs($athlete)
        ->patch('/settings/overview/training-preferences', $payload)
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/overview?tab=training');

    $athlete->refresh();

    expect($athlete->athleteProfile)->not->toBeNull();
    expect($athlete->athleteProfile->primary_sport)->toBe('bike');
    expect($athlete->athleteProfile->weekly_training_days)->toBe(5);
    expect($athlete->athleteProfile->ftp_watts)->toBe(320);
    expect($athlete->athleteProfile->max_heart_rate_bpm)->toBe(192);
    expect($athlete->athleteProfile->threshold_heart_rate_bpm)->toBe(176);
    expect($athlete->athleteProfile->threshold_pace_minutes_per_km)->toBe(238);
    expect($athlete->athleteProfile->power_zones)->toMatchArray($payload['power_zones']);
    expect($athlete->athleteProfile->heart_rate_zones)->toMatchArray($payload['heart_rate_zones']);
});

it('validates heart rate anchors and zone ranges for athletes', function () {
    $athlete = User::factory()->athlete()->create();

    $this
        ->actingAs($athlete)
        ->from('/settings/overview?tab=training')
        ->patch('/settings/overview/training-preferences', [
            'primary_sport' => 'run',
            'weekly_training_days' => 6,
            'preferred_rest_day' => 'monday',
            'intensity_distribution' => 'polarized',
            'max_heart_rate_bpm' => 180,
            'threshold_heart_rate_bpm' => 188,
            'power_zones' => [
                ['label' => 'Z1', 'min' => 75, 'max' => 55],
                ['label' => 'Z2', 'min' => 76, 'max' => 90],
                ['label' => 'Z3', 'min' => 91, 'max' => 105],
                ['label' => 'Z4', 'min' => 106, 'max' => 120],
                ['label' => 'Z5', 'min' => 121, 'max' => 150],
            ],
            'heart_rate_zones' => [
                ['label' => 'Z1', 'min' => 60, 'max' => 72],
                ['label' => 'Z2', 'min' => 73, 'max' => 82],
                ['label' => 'Z3', 'min' => 83, 'max' => 89],
                ['label' => 'Z4', 'min' => 90, 'max' => 95],
                ['label' => 'Z5', 'min' => 96, 'max' => 100],
            ],
        ])
        ->assertSessionHasErrors([
            'threshold_heart_rate_bpm',
            'power_zones.0.max',
        ])
        ->assertRedirect('/settings/overview?tab=training');
});

it('forbids non-athletes from updating athlete training preferences', function () {
    $coach = User::factory()->coach()->create();

    $this
        ->actingAs($coach)
        ->patch('/settings/overview/training-preferences', [
            'primary_sport' => 'run',
            'weekly_training_days' => 6,
            'preferred_rest_day' => 'monday',
            'intensity_distribution' => 'polarized',
        ])
        ->assertForbidden();
});
