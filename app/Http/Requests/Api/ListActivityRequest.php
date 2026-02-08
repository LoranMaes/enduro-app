<?php

namespace App\Http\Requests\Api;

use App\Services\ActivityProviders\ActivityProviderManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListActivityRequest extends FormRequest
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
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'provider' => [
                'nullable',
                'string',
                Rule::in($this->allowedProviders()),
            ],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }

    /**
     * @return list<string>
     */
    private function allowedProviders(): array
    {
        return app(ActivityProviderManager::class)->allowedProviders();
    }
}
