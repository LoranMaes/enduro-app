<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachApplicationFile extends Model
{
    use HasFactory;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'coach_application_id',
        'coach_application_uuid_id',
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
