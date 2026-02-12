<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntryTypeEntitlement extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'requires_subscription',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requires_subscription' => 'bool',
        ];
    }
}
