<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntryTypeEntitlement extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'requires_subscription',
        'updated_by_admin_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requires_subscription' => 'bool',
            'updated_by_admin_id' => 'int',
        ];
    }

    public function updatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_admin_id');
    }
}
