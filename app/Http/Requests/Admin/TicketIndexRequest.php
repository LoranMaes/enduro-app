<?php

namespace App\Http\Requests\Admin;

use App\Enums\TicketImportance;
use App\Enums\TicketStatus;
use App\Enums\TicketType;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TicketIndexRequest extends FormRequest
{
    private const array VIEW_OPTIONS = [
        'board',
        'archived',
    ];

    private const array SORT_OPTIONS = [
        'title',
        'status',
        'type',
        'importance',
        'created_at',
        'updated_at',
    ];

    private const array DIRECTION_OPTIONS = [
        'asc',
        'desc',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->can('viewAny', Ticket::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'view' => ['nullable', Rule::in(self::VIEW_OPTIONS)],
            'search' => ['nullable', 'string', 'max:160'],
            'assignee_admin_id' => ['nullable', 'integer'],
            'creator_admin_id' => ['nullable', 'integer'],
            'type' => ['nullable', Rule::in(TicketType::values())],
            'importance' => ['nullable', Rule::in(TicketImportance::values())],
            'status' => ['nullable', Rule::in(TicketStatus::values())],
            'sort' => ['nullable', Rule::in(self::SORT_OPTIONS)],
            'direction' => ['nullable', Rule::in(self::DIRECTION_OPTIONS)],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ];
    }
}
