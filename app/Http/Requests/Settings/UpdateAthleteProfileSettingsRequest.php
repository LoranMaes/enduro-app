<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAthleteProfileSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            return false;
        }

        if (! $this->hasSession()) {
            return true;
        }

        return ! (
            $this->session()->has('impersonation.original_user_id')
            && $this->session()->has('impersonation.impersonated_user_id')
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()?->id),
            ],
            'timezone' => ['required', 'timezone'],
            'unit_system' => ['required', Rule::in(['metric', 'imperial'])],
        ];
    }
}
