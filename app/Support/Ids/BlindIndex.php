<?php

namespace App\Support\Ids;

use Illuminate\Support\Str;

class BlindIndex
{
    public function forEmail(?string $email): ?string
    {
        if ($email === null || trim($email) === '') {
            return null;
        }

        return $this->hash(Str::lower(trim($email)));
    }

    public function forGeneric(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return $this->hash(trim($value));
    }

    public function forExternalActivityId(int|string|null $athleteId, ?string $provider, ?string $externalId): ?string
    {
        if ($athleteId === null || $provider === null || $externalId === null) {
            return null;
        }

        $normalizedProvider = Str::lower(trim($provider));
        $normalizedExternalId = trim($externalId);

        if ($normalizedProvider === '' || $normalizedExternalId === '') {
            return null;
        }

        return $this->hash(sprintf(
            'activity:%s:%s:%s',
            $athleteId,
            $normalizedProvider,
            $normalizedExternalId,
        ));
    }

    public function forProviderAthleteId(?string $provider, ?string $providerAthleteId): ?string
    {
        if ($provider === null || $providerAthleteId === null) {
            return null;
        }

        $normalizedProvider = Str::lower(trim($provider));
        $normalizedProviderAthleteId = trim($providerAthleteId);

        if ($normalizedProvider === '' || $normalizedProviderAthleteId === '') {
            return null;
        }

        return $this->hash(sprintf(
            'provider-athlete:%s:%s',
            $normalizedProvider,
            $normalizedProviderAthleteId,
        ));
    }

    private function hash(string $value): string
    {
        return hash_hmac('sha256', $value, (string) config('app.key'));
    }
}
