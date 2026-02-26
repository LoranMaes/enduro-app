<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLibraryItem extends Model
{
    /** @use HasFactory<\Database\Factories\WorkoutLibraryItemFactory> */
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
        'title',
        'sport',
        'structure_json',
        'estimated_duration_minutes',
        'estimated_tss',
        'tags',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'structure_json' => 'array',
            'estimated_duration_minutes' => 'integer',
            'estimated_tss' => 'integer',
            'tags' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
