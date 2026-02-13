<?php

namespace App\Http\Requests\Api;

use App\Enums\GoalPriority;
use App\Enums\GoalSport;
use App\Enums\GoalStatus;
use App\Enums\GoalType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'required', 'string', Rule::enum(GoalType::class)],
            'sport' => ['sometimes', 'nullable', 'string', Rule::enum(GoalSport::class)],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'target_date' => ['sometimes', 'nullable', 'date'],
            'priority' => ['sometimes', 'nullable', 'string', Rule::enum(GoalPriority::class)],
            'status' => ['sometimes', 'required', 'string', Rule::enum(GoalStatus::class)],
        ];
    }
}
