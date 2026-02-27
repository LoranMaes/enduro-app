<?php

use App\Services\Progress\ActualTssRecommendationService;

it('returns insufficient when trailing history is below minimum data points', function () {
    $service = app(ActualTssRecommendationService::class);

    $result = $service->resolve(
        [
            '2026-02-02' => 0,
            '2026-02-09' => 70,
            '2026-02-16' => 95,
        ],
        [
            '2026-02-02',
            '2026-02-09',
            '2026-02-16',
        ],
    );

    expect($result['2026-02-02']['min_tss'])->toBeNull();
    expect($result['2026-02-02']['max_tss'])->toBeNull();
    expect($result['2026-02-02']['state'])->toBe('insufficient');

    expect($result['2026-02-09']['state'])->toBe('insufficient');
});

it('classifies low in range and high states from trailing actual tss bands', function () {
    $service = app(ActualTssRecommendationService::class);

    $result = $service->resolve(
        [
            '2026-01-05' => 80,
            '2026-01-12' => 100,
            '2026-01-19' => 0,
            '2026-01-26' => 0,
            '2026-02-02' => 70,
            '2026-02-09' => 85,
            '2026-02-16' => 130,
        ],
        [
            '2026-02-02',
            '2026-02-09',
            '2026-02-16',
        ],
    );

    expect($result['2026-02-02']['min_tss'])->toBe(77);
    expect($result['2026-02-02']['max_tss'])->toBe(103);
    expect($result['2026-02-02']['state'])->toBe('low');

    expect($result['2026-02-09']['state'])->toBe('in_range');
    expect($result['2026-02-16']['state'])->toBe('high');
    expect($result['2026-02-16']['source'])->toBe('actual_tss_trailing_4w');
});
