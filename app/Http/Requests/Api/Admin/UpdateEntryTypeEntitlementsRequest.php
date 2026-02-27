<?php

namespace App\Http\Requests\Api\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEntryTypeEntitlementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAdmin();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'entitlements' => ['required', 'array'],
            'entitlements.*.key' => ['required', 'string', 'max:120'],
            'entitlements.*.requires_subscription' => ['required', 'boolean'],
        ];
    }
}
