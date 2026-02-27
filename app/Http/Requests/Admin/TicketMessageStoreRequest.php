<?php

namespace App\Http\Requests\Admin;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class TicketMessageStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $ticket = $this->route('ticket');

        return $user instanceof User
            && $ticket instanceof Ticket
            && $user->can('replySupport', $ticket);
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
            'body.required' => 'Please write a reply before sending.',
            'body.max' => 'Replies may not be longer than 8000 characters.',
        ];
    }
}
