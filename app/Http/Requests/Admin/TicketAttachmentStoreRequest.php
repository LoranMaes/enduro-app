<?php

namespace App\Http\Requests\Admin;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class TicketAttachmentStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $ticket = $this->route('ticket');

        return $user instanceof User
            && $ticket instanceof Ticket
            && $user->can('manageAttachment', $ticket);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $allowedExtensions = collect((array) config('tickets.attachments.allowed_extensions', []))
            ->filter(static fn (mixed $extension): bool => is_string($extension) && trim($extension) !== '')
            ->map(static fn (string $extension): string => strtolower(trim($extension)))
            ->values()
            ->all();

        if ($allowedExtensions === []) {
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt', 'zip'];
        }

        $maxFileSizeKb = max(1, (int) config('tickets.attachments.max_file_size_kb', 25600));

        return [
            'file' => [
                'required',
                'file',
                'mimes:'.implode(',', $allowedExtensions),
                'max:'.$maxFileSizeKb,
            ],
            'display_name' => ['nullable', 'string', 'max:180'],
        ];
    }
}
