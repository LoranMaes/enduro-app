<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupportTicketStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && $user->can('createSupport', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'type' => ['required', Rule::in(['bug', 'feature', 'support'])],
            'message' => ['required', 'string', 'max:8000'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Please add a title before submitting your support ticket.',
            'title.max' => 'The title may not be longer than 180 characters.',
            'type.required' => 'Please select what kind of ticket you are creating.',
            'type.in' => 'Only bug reports, feature requests, and support questions are allowed.',
            'message.required' => 'Please include a message so we can help you.',
            'message.max' => 'Your message may not be longer than 8000 characters.',
        ];
    }
}
