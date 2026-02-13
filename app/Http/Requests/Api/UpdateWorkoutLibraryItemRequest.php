<?php

namespace App\Http\Requests\Api;

use App\Enums\TrainingSessionSport;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkoutLibraryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAthlete();
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'sport' => ['sometimes', 'required', Rule::enum(TrainingSessionSport::class)],
            'structure_json' => ['sometimes', 'required', 'array'],
            'structure_json.unit' => ['nullable', 'string', 'max:40'],
            'structure_json.mode' => ['nullable', 'string', 'max:40'],
            'structure_json.steps' => ['sometimes', 'required', 'array', 'min:1'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:40'],
        ];
    }
}
