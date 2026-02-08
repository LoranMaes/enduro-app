<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncActivityProviderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user instanceof User) {
            return false;
        }

        return $user->canManageActivityProviderConnections();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'provider' => [
                'required',
                'string',
                Rule::in($this->allowedProviders()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        return [
            ...$this->all(),
            'provider' => $this->route('provider'),
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
