<?php

namespace App\Http\Requests\Api;

use App\Enums\TrainingSessionSport;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkoutLibraryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAthlete();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'sport' => ['required', Rule::enum(TrainingSessionSport::class)],
            'structure_json' => ['required', 'array'],
            'structure_json.unit' => ['nullable', 'string', 'max:40'],
            'structure_json.mode' => ['nullable', 'string', 'max:40'],
            'structure_json.steps' => ['required', 'array', 'min:1'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:40'],
        ];
    }
}
