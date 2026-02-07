<?php

namespace App\Http\Requests\Api;

use App\Models\TrainingWeek;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTrainingWeekRequest extends FormRequest
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
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
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

            $trainingWeek = $this->route('training_week');
            $trainingWeekId = $trainingWeek instanceof TrainingWeek
                ? $trainingWeek->id
                : (int) $trainingWeek;
            $trainingPlanId = $trainingWeek instanceof TrainingWeek
                ? $trainingWeek->training_plan_id
                : 0;

            $startsAt = (string) $this->input('starts_at');
            $endsAt = (string) $this->input('ends_at');

            $overlapExists = TrainingWeek::query()
                ->where('training_plan_id', $trainingPlanId)
                ->where('id', '!=', $trainingWeekId)
                ->whereDate('starts_at', '<=', $endsAt)
                ->whereDate('ends_at', '>=', $startsAt)
                ->exists();

            if ($overlapExists) {
                $validator->errors()->add(
                    'starts_at',
                    'This week overlaps an existing week in the same training plan.',
                );
            }
        });
    }
}
