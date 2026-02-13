<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAtpWeekRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAthlete();
    }

    public function rules(): array
    {
        return [
            'week_type' => [
                'sometimes',
                'required',
                'string',
                Rule::in(config('training.atp.week_types', [])),
            ],
            'priority' => [
                'sometimes',
                'required',
                'string',
                Rule::in(config('training.atp.priorities', [])),
            ],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
