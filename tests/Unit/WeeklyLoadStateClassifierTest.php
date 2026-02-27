<?php

use App\Services\Metrics\WeeklyLoadStateClassifier;

it('returns insufficient state when planned tss is zero', function () {
    $result = app(WeeklyLoadStateClassifier::class)->classify(0, 120);

    expect($result['load_state'])->toBe('insufficient');
    expect($result['load_state_ratio'])->toBeNull();
    expect($result['load_state_source'])->toBe('planned_completed_tss_ratio');
});

it('classifies low in range and high states from ratio thresholds', function () {
    $classifier = app(WeeklyLoadStateClassifier::class);

    $low = $classifier->classify(100, 84);
    $inRangeLowerBound = $classifier->classify(100, 85);
    $inRangeUpperBound = $classifier->classify(100, 115);
    $high = $classifier->classify(100, 116);

    expect($low['load_state'])->toBe('low');
    expect(abs(($low['load_state_ratio'] ?? 0) - 0.84))->toBeLessThan(0.0001);

    expect($inRangeLowerBound['load_state'])->toBe('in_range');
    expect(abs(($inRangeLowerBound['load_state_ratio'] ?? 0) - 0.85))->toBeLessThan(0.0001);

    expect($inRangeUpperBound['load_state'])->toBe('in_range');
    expect(abs(($inRangeUpperBound['load_state_ratio'] ?? 0) - 1.15))->toBeLessThan(0.0001);

    expect($high['load_state'])->toBe('high');
    expect(abs(($high['load_state_ratio'] ?? 0) - 1.16))->toBeLessThan(0.0001);
});
