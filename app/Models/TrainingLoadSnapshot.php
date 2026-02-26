<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingLoadSnapshot extends Model
{
    use HasFactory;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'user_id',
        'user_uuid_id',
        'date',
        'sport',
        'tss',
        'atl',
        'ctl',
        'tsb',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'tss' => 'float',
            'atl' => 'float',
            'ctl' => 'float',
            'tsb' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
