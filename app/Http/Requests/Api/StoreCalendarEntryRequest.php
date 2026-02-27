<?php

namespace App\Http\Requests\Api;

use App\Enums\CalendarEntryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCalendarEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'type' => ['required', 'string', Rule::enum(CalendarEntryType::class)],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:5000'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
