<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLibraryItem extends Model
{
    /** @use HasFactory<\Database\Factories\WorkoutLibraryItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
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
