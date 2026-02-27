<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionFeatureEntitlement extends Model
{
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'key',
        'athlete_free_enabled',
        'athlete_free_limit',
        'athlete_paid_enabled',
        'coach_paid_enabled',
        'updated_by_admin_id',
        'updated_by_admin_uuid_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'athlete_free_enabled' => 'bool',
            'athlete_free_limit' => 'int',
            'athlete_paid_enabled' => 'bool',
            'coach_paid_enabled' => 'bool',
            'updated_by_admin_id' => 'int',
        ];
    }

    public function updatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_admin_id');
    }
}
