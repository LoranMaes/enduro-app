<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SupportTicketAttachmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $ticket = $this->route('ticket');

        return $user instanceof User
            && $ticket instanceof Ticket
            && $user->can('createSupportAttachment', $ticket);
    }

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

        $maxFileSizeKb = max(1, (int) config('tickets.support.attachments.max_file_size_kb', 10240));

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $ticket = $this->route('ticket');

            if (! $ticket instanceof Ticket) {
                return;
            }

            $maxFiles = max(1, (int) config('tickets.support.attachments.max_files_per_ticket', 5));

            if ($ticket->attachments()->count() >= $maxFiles) {
                $validator->errors()->add(
                    'file',
                    "You can upload up to {$maxFiles} files per support ticket.",
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please choose a file to upload.',
            'file.file' => 'The uploaded attachment is invalid.',
            'file.mimes' => 'This file type is not supported for support attachments.',
            'file.max' => 'Files must be 10MB or smaller.',
            'display_name.max' => 'Display names may not be longer than 180 characters.',
        ];
    }
}
