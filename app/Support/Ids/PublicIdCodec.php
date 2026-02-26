<?php

namespace App\Support\Ids;

use Illuminate\Support\Facades\Crypt;

class PublicIdCodec
{
    public function encode(string $uuid): string
    {
        $encrypted = Crypt::encryptString($uuid);

        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    public function decode(string $publicId): ?string
    {
        $decoded = base64_decode(strtr($publicId, '-_', '+/'), true);

        if (! is_string($decoded) || $decoded === '') {
            return null;
        }

        try {
            return Crypt::decryptString($decoded);
        } catch (\Throwable) {
            return null;
        }
    }
}
