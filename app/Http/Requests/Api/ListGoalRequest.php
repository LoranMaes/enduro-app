<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ListGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['sometimes', 'required', 'date'],
            'to' => ['sometimes', 'required', 'date'],
            'per_page' => ['sometimes', 'required', 'integer', 'min:1', 'max:200'],
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
        ];
    }
}
