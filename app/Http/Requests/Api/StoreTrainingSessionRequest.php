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
