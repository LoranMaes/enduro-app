<?php

namespace App\Http\Requests\Api;

use App\Enums\GoalPriority;
use App\Enums\GoalSport;
use App\Enums\GoalStatus;
use App\Enums\GoalType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'type' => ['required', 'string', Rule::enum(GoalType::class)],
            'sport' => ['nullable', 'string', Rule::enum(GoalSport::class)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'target_date' => ['nullable', 'date'],
            'priority' => ['nullable', 'string', Rule::enum(GoalPriority::class)],
            'status' => ['sometimes', 'required', 'string', Rule::enum(GoalStatus::class)],
        ];
    }
}
