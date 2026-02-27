<?php

namespace App\Models;

use App\Concerns\LogsModelActivity;
use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachAthleteAssignment extends Model
{
    use HasFactory;
    use LogsModelActivity;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'coach_id',
        'coach_uuid_id',
        'athlete_id',
        'athlete_uuid_id',
        'uuid_id',
        'public_id',
    ];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(User::class, 'athlete_id');
    }
}
