<?php

namespace App\Services\Metrics;

use App\Enums\AthleteWeekLoadState;

class WeeklyLoadStateClassifier
{
    public function classify(
        int $plannedTssTotal,
        int $completedTssTotal,
    ): array {
        if ($plannedTssTotal <= 0) {
            return [
                'load_state' => AthleteWeekLoadState::Insufficient->value,
                'load_state_ratio' => null,
                'load_state_source' => 'planned_completed_tss_ratio',
            ];
        }

        $ratio = $completedTssTotal / $plannedTssTotal;

        if ($ratio < 0.85) {
            return [
                'load_state' => AthleteWeekLoadState::Low->value,
                'load_state_ratio' => $ratio,
                'load_state_source' => 'planned_completed_tss_ratio',
            ];
        }

        if ($ratio <= 1.15) {
            return [
                'load_state' => AthleteWeekLoadState::InRange->value,
                'load_state_ratio' => $ratio,
                'load_state_source' => 'planned_completed_tss_ratio',
            ];
        }

        return [
            'load_state' => AthleteWeekLoadState::High->value,
            'load_state_ratio' => $ratio,
            'load_state_source' => 'planned_completed_tss_ratio',
        ];
    }
}
