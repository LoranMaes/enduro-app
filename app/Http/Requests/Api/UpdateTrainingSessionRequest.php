<?php

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\HasTrainingSessionRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTrainingSessionRequest extends FormRequest
{
    use HasTrainingSessionRules;

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
        return $this->trainingSessionRules();
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $this->applyTrainingSessionValidator($validator);
    }
}
