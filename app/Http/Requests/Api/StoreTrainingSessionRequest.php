<?php

namespace App\Http\Requests\Api;

use App\Enums\TrainingSessionSport;
use App\Models\TrainingWeek;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTrainingSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'training_week_id' => ['nullable', 'integer', 'exists:training_weeks,id'],
            'date' => ['required', 'date'],
            'sport' => ['required', Rule::enum(TrainingSessionSport::class)],
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
            'planned_structure.steps.*.duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'planned_structure.steps.*.target' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.range_min' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.range_max' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.repeat_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'planned_structure.steps.*.note' => ['nullable', 'string', 'max:500'],
            'planned_structure.steps.*.items' => ['nullable', 'array', 'min:1'],
            'planned_structure.steps.*.items.*.id' => ['nullable', 'string', 'max:64'],
            'planned_structure.steps.*.items.*.label' => ['nullable', 'string', 'max:80'],
            'planned_structure.steps.*.items.*.duration_minutes' => ['required_with:planned_structure.steps.*.items', 'integer', 'min:1', 'max:600'],
            'planned_structure.steps.*.items.*.target' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.items.*.range_min' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'planned_structure.steps.*.items.*.range_max' => ['nullable', 'numeric', 'min:0', 'max:300'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->input('training_week_id') === null) {
                return;
            }

            $trainingWeek = TrainingWeek::query()
                ->with('trainingPlan:id,user_id')
                ->find((int) $this->input('training_week_id'));

            if (! $trainingWeek instanceof TrainingWeek) {
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

            if (! is_array($plannedStructure)) {
                return;
            }

            $mode = $plannedStructure['mode'] ?? null;
            $steps = $plannedStructure['steps'] ?? [];

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
}
