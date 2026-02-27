<?php

return [
    'archive_delay_hours' => (int) env('TICKETS_ARCHIVE_DELAY_HOURS', 24),

    'attachments' => [
        'disk' => env('TICKET_ATTACHMENTS_DISK', env('FILESYSTEM_DISK', 'local')),
        'max_file_size_kb' => (int) env('TICKET_ATTACHMENTS_MAX_FILE_SIZE_KB', 25600),
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt', 'zip'],
    ],

    'support' => [
        'attachments' => [
            'max_file_size_kb' => (int) env('SUPPORT_TICKET_ATTACHMENTS_MAX_FILE_SIZE_KB', 10240),
            'max_files_per_ticket' => (int) env('SUPPORT_TICKET_ATTACHMENTS_MAX_FILES_PER_TICKET', 5),
        ],
    ],
];
