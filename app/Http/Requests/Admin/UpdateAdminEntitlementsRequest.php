<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminEntitlementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        $entryTypeKeys = collect((array) config('training.entry_types.definitions', []))
            ->map(static fn (mixed $definition): ?string => is_array($definition)
                ? strtolower(trim((string) ($definition['key'] ?? '')))
                : null)
            ->filter()
            ->values()
            ->all();
        $subscriptionFeatureKeys = collect((array) config('subscription-features.definitions', []))
            ->map(static fn (mixed $definition): ?string => is_array($definition)
                ? strtolower(trim((string) ($definition['key'] ?? '')))
                : null)
            ->filter()
            ->values()
            ->all();

        return [
            'ticket_archive_delay_hours' => ['sometimes', 'required', 'integer', 'min:1', 'max:168'],
            'entitlements' => ['sometimes', 'required', 'array'],
            'entitlements.*.key' => ['required', 'string', 'max:120', Rule::in($entryTypeKeys)],
            'entitlements.*.requires_subscription' => ['required', 'boolean'],
            'subscription_entitlements' => ['sometimes', 'required', 'array'],
            'subscription_entitlements.*.key' => ['required', 'string', 'max:120', Rule::in($subscriptionFeatureKeys)],
            'subscription_entitlements.*.athlete_free_enabled' => ['required', 'boolean'],
            'subscription_entitlements.*.athlete_free_limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'subscription_entitlements.*.athlete_paid_enabled' => ['required', 'boolean'],
            'subscription_entitlements.*.coach_paid_enabled' => ['nullable', 'boolean'],
        ];
    }
}
