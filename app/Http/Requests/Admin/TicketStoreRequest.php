<?php

namespace App\Http\Requests\Admin;

use App\Enums\TicketImportance;
use App\Enums\TicketStatus;
use App\Enums\TicketType;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TicketStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && $user->can('create', Ticket::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'array'],
            'status' => ['nullable', Rule::in(TicketStatus::values())],
            'type' => ['required', Rule::in(TicketType::values())],
            'importance' => ['required', Rule::in(TicketImportance::values())],
            'assignee_admin_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(static fn ($query) => $query->where('role', 'admin')),
            ],
            'mention_admin_ids' => ['sometimes', 'array'],
            'mention_admin_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where(static fn ($query) => $query->where('role', 'admin')),
            ],
        ];
    }
}
