<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class SupportTicketMessageStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $ticket = $this->route('ticket');

        return $user instanceof User
            && $ticket instanceof Ticket
            && $user->can('createSupportMessage', $ticket);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:8000'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Please write a message before sending it.',
            'body.max' => 'Messages may not be longer than 8000 characters.',
        ];
    }
}
