<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminEntitlementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ticket_archive_delay_hours' => ['sometimes', 'required', 'integer', 'min:1', 'max:168'],
            'entitlements' => ['sometimes', 'required', 'array'],
            'entitlements.*.key' => ['required', 'string', 'max:120'],
            'entitlements.*.requires_subscription' => ['required', 'boolean'],
        ];
    }
}
