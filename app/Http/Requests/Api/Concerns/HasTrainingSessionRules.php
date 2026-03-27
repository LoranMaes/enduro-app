<?php

namespace App\Http\Requests\Api\Concerns;

use App\Enums\TrainingSessionSport;
use App\Models\TrainingWeek;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait HasTrainingSessionRules
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    protected function trainingSessionRules(): array
    {
        return [
            'training_week_id' => ['nullable'],
            'date' => ['required', 'date'],
            'sport' => ['required', Rule::enum(TrainingSessionSport::class)],
            'title' => ['nullable', 'string', 'max:180'],
            'planned_duration_minutes' => ['required', 'integer', 'min:1'],
            'planned_tss' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'planned_structure' => ['nullable', 'array'],
            'planned_structure.unit' => ['required_with:planned_structure', Rule::in([
                'ftp_percent',
                'max_hr_percent',
                'threshold_hr_percent',
                'threshold_speed_percent',
                'rpe',
            ])],
            'planned_structure.mode' => ['required_with:planned_structure', Rule::in([
                'range',
                'target',
            ])],
            'planned_structure.steps' => ['required_with:planned_structure', 'array', 'min:1'],
            'planned_structure.steps.*.id' => ['nullable', 'string', 'max:64'],
            'planned_structure.steps.*.type' => ['required', Rule::in([
                'warmup',
                'active',
                'recovery',
                'cooldown',
                'two_step_repeats',
                'three_step_repeats',
                'repeats',
                'ramp_up',
                'ramp_down',
            ])],
            'planned_structure.steps.*.duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'planned_structure.steps.*.duration_seconds' => ['nullable', 'integer', 'min:30', 'max:43200'],
            'planned_structure.steps.*.duration_type' => ['nullable', Rule::in(['time', 'distance'])],
            'planned_structure.steps.*.distance_meters' => ['nullable', 'integer', 'min:1', 'max:500000'],
            'planned_structure.steps.*.target' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.range_min' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.range_max' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.zone_label' => ['nullable', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
            'planned_structure.steps.*.repeat_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'planned_structure.steps.*.note' => ['nullable', 'string', 'max:500'],
            'planned_structure.steps.*.items' => ['nullable', 'array', 'min:1'],
            'planned_structure.steps.*.items.*.id' => ['nullable', 'string', 'max:64'],
            'planned_structure.steps.*.items.*.label' => ['nullable', 'string', 'max:80'],
            'planned_structure.steps.*.items.*.duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'planned_structure.steps.*.items.*.duration_seconds' => ['nullable', 'integer', 'min:30', 'max:43200'],
            'planned_structure.steps.*.items.*.duration_type' => ['nullable', Rule::in(['time', 'distance'])],
            'planned_structure.steps.*.items.*.distance_meters' => ['nullable', 'integer', 'min:1', 'max:500000'],
            'planned_structure.steps.*.items.*.target' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.items.*.range_min' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.items.*.range_max' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.items.*.zone_label' => ['nullable', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
        ];
    }

    protected function applyTrainingSessionValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $trainingWeekId = $this->input('training_week_id');

            if ($trainingWeekId === null || $trainingWeekId === '') {
                return;
            }

            $trainingWeek = $this->resolveTrainingWeek($trainingWeekId);

            if (! $trainingWeek instanceof TrainingWeek) {
                $validator->errors()->add(
                    'training_week_id',
                    'The selected training week id is invalid.',
                );

                return;
            }

            $user = $this->user();

            if (
                $user instanceof User
                && ($user->isAthlete() || $user->isAdmin())
                && ! $this->isTrainingWeekAccessibleToUser($user, $trainingWeek)
            ) {
                $validator->errors()->add(
                    'training_week_id',
                    'The selected training week is invalid.',
                );

                return;
            }

            $sessionDate = (string) $this->input('date');
            $weekStartsAt = $trainingWeek->starts_at?->toDateString();
            $weekEndsAt = $trainingWeek->ends_at?->toDateString();

            if (
                $weekStartsAt !== null
                && $weekEndsAt !== null
                && ($sessionDate < $weekStartsAt || $sessionDate > $weekEndsAt)
            ) {
                $validator->errors()->add(
                    'date',
                    'The session date must be within the selected training week range.',
                );
            }

            $plannedStructure = $this->input('planned_structure');
            $sessionSport = (string) $this->input('sport');

            if (! is_array($plannedStructure)) {
                return;
            }

            $mode = $plannedStructure['mode'] ?? null;
            $unit = $plannedStructure['unit'] ?? null;
            $steps = $plannedStructure['steps'] ?? [];

            if (is_string($unit) && ! in_array($unit, $this->allowedUnitsForSport($sessionSport), true)) {
                $validator->errors()->add(
                    'planned_structure.unit',
                    'The selected structure unit is invalid for this sport.',
                );
            }

            if (! is_array($steps)) {
                return;
            }

            foreach ($steps as $index => $step) {
                if (! is_array($step)) {
                    continue;
                }

                $sources = is_array($step['items'] ?? null) && ($step['items'] ?? []) !== []
                    ? $step['items']
                    : [$step];

                foreach ($sources as $sourceIndex => $source) {
                    if (! is_array($source)) {
                        continue;
                    }

                    $prefix = is_array($step['items'] ?? null) && ($step['items'] ?? []) !== []
                        ? "planned_structure.steps.{$index}.items.{$sourceIndex}"
                        : "planned_structure.steps.{$index}";
                    $durationType = ($source['duration_type'] ?? 'time') === 'distance'
                        ? 'distance'
                        : 'time';
                    $durationMinutes = $source['duration_minutes'] ?? null;
                    $durationSeconds = $source['duration_seconds'] ?? null;
                    $distanceMeters = $source['distance_meters'] ?? null;

                    if ($durationType === 'distance') {
                        if (! is_numeric($distanceMeters) || (int) $distanceMeters <= 0) {
                            $validator->errors()->add(
                                "{$prefix}.distance_meters",
                                'Distance duration requires a distance value.',
                            );
                        }
                    }

                    if ($durationType === 'time') {
                        if (
                            (! is_numeric($durationMinutes) || (int) $durationMinutes <= 0)
                            && (! is_numeric($durationSeconds) || (int) $durationSeconds <= 0)
                        ) {
                            $validator->errors()->add(
                                "{$prefix}.duration_seconds",
                                'Time duration requires minutes or seconds.',
                            );
                        }
                    }

                    if ($mode === 'range') {
                        if (
                            ($source['range_min'] ?? null) === null ||
                            ($source['range_max'] ?? null) === null
                        ) {
                            $validator->errors()->add(
                                "{$prefix}.range_min",
                                'Range mode requires minimum and maximum targets for each block.',
                            );
                        }

                        if (
                            is_numeric($source['range_min'] ?? null)
                            && is_numeric($source['range_max'] ?? null)
                            && (float) $source['range_max'] < (float) $source['range_min']
                        ) {
                            $validator->errors()->add(
                                "{$prefix}.range_max",
                                'Range maximum must be greater than or equal to minimum.',
                            );
                        }
                    }

                    if ($mode === 'target' && ($source['target'] ?? null) === null) {
                        $validator->errors()->add(
                            "{$prefix}.target",
                            'Target mode requires a target value for each block.',
                        );
                    }
                }
            }
        });
    }

    private function resolveTrainingWeek(mixed $trainingWeekId): ?TrainingWeek
    {
        $trainingWeek = (new TrainingWeek)->resolveRouteBinding($trainingWeekId);

        if ($trainingWeek instanceof TrainingWeek) {
            return $trainingWeek->loadMissing('trainingPlan:id,user_id');
        }

        if (! is_numeric($trainingWeekId)) {
            return null;
        }

        return TrainingWeek::query()
            ->with('trainingPlan:id,user_id')
            ->find((int) $trainingWeekId);
    }

    private function isTrainingWeekAccessibleToUser(User $user, TrainingWeek $trainingWeek): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isAthlete()) {
            return $trainingWeek->trainingPlan->user_id === $user->id;
        }

        return false;
    }

    /**
     * @return array<int, string>
     */
    private function allowedUnitsForSport(string $sport): array
    {
        return match ($sport) {
            'bike', 'mtn_bike' => ['ftp_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
            'run', 'walk' => ['threshold_speed_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
            'swim' => ['max_hr_percent', 'threshold_hr_percent', 'rpe'],
            'gym', 'day_off' => ['rpe'],
            'custom', 'other' => ['rpe', 'max_hr_percent'],
            default => ['rpe'],
        };
    }
}
