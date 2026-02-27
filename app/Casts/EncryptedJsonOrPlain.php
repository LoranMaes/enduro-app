<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EncryptedJsonOrPlain implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        $decodedPlainValue = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decodedPlainValue;
        }

        try {
            $decrypted = Crypt::decryptString($value);
            $decoded = json_decode($decrypted, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null) {
            return null;
        }

        $jsonValue = is_string($value)
            ? $value
            : json_encode($value);

        if (! is_string($jsonValue)) {
            return null;
        }

        if (config('id_migration.crypto.mode', 'legacy') === 'legacy') {
            return $jsonValue;
        }

        return Crypt::encryptString($jsonValue);
    }
}
