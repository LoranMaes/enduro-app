<?php

namespace App\Http\Requests\Api;

use App\Enums\CalendarEntryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCalendarEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['sometimes', 'required', 'date'],
            'type' => ['sometimes', 'required', 'string', Rule::enum(CalendarEntryType::class)],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'meta' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
