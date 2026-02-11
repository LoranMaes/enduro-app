<?php

namespace App\Services\Uploads;

use Illuminate\Http\UploadedFile;

class FileUploadService
{
    /**
     * @param  array<string, mixed>  $options
     * @return array{
     *     disk: string,
     *     path: string,
     *     original_name: string,
     *     extension: string|null,
     *     mime_type: string,
     *     size_bytes: int
     * }
     */
    public function store(UploadedFile $file, string $directory, string $disk, array $options = []): array
    {
        $path = $file->store($directory, [
            'disk' => $disk,
            ...$options,
        ]);

        return [
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'extension' => $this->normalizeExtension($file->getClientOriginalExtension()),
            'mime_type' => (string) ($file->getClientMimeType() ?? $file->getMimeType() ?? 'application/octet-stream'),
            'size_bytes' => max(0, (int) $file->getSize()),
        ];
    }

    private function normalizeExtension(string $extension): ?string
    {
        $trimmed = strtolower(trim($extension));

        return $trimmed === '' ? null : $trimmed;
    }
}
