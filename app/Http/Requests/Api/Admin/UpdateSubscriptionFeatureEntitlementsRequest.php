<?php

namespace App\Http\Requests\Api\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionFeatureEntitlementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $featureKeys = collect((array) config('subscription-features.definitions', []))
            ->map(static fn (mixed $definition): ?string => is_array($definition)
                ? strtolower(trim((string) ($definition['key'] ?? '')))
                : null)
            ->filter()
            ->values()
            ->all();

        return [
            'entitlements' => ['required', 'array'],
            'entitlements.*.key' => ['required', 'string', 'max:120', Rule::in($featureKeys)],
            'entitlements.*.athlete_free_enabled' => ['nullable', 'boolean'],
            'entitlements.*.athlete_free_limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'entitlements.*.athlete_paid_enabled' => ['nullable', 'boolean'],
            'entitlements.*.coach_paid_enabled' => ['nullable', 'boolean'],
        ];
    }
}
