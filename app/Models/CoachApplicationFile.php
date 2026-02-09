<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachApplicationFile extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'coach_application_id',
        'stored_disk',
        'stored_path',
        'original_name',
        'display_name',
        'extension',
        'mime_type',
        'size_bytes',
        'sort_order',
    ];

    public function coachApplication(): BelongsTo
    {
        return $this->belongsTo(CoachApplication::class);
    }
}
