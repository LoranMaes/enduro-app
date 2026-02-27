<?php

namespace App\Rules;

use App\Models\User;
use App\Support\Ids\BlindIndex;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueEmailBlindIndex implements ValidationRule
{
    public function __construct(
        private readonly ?string $ignoredUserPrimaryKey = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        $blindIndex = app(BlindIndex::class)->forEmail($value);

        if ($blindIndex === null) {
            return;
        }

        $query = User::query()
            ->where('email_bidx', $blindIndex);

        if ($this->ignoredUserPrimaryKey !== null) {
            $query->whereKeyNot($this->ignoredUserPrimaryKey);
        }

        if ($query->exists()) {
            $fail('The email has already been taken.');
        }
    }
}
