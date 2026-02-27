<?php

namespace App\Models;

use App\Models\Concerns\HasBlindIndexes;
use App\Models\Concerns\UsesDualUuidIdentity;
use App\Support\Ids\BlindIndex;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Activity extends Model
{
    use HasBlindIndexes;
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'training_session_id',
        'training_session_uuid_id',
        'athlete_id',
        'athlete_uuid_id',
        'provider',
        'external_id',
        'external_id_bidx',
        'sport',
        'started_at',
        'duration_seconds',
        'distance_meters',
        'elevation_gain_meters',
        'raw_payload',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'deleted_at' => 'datetime',
            'distance_meters' => 'float',
            'elevation_gain_meters' => 'float',
            'external_id' => \App\Casts\EncryptedStringOrPlain::class,
            'raw_payload' => 'array',
        ];
    }

    public function syncBlindIndexes(): void
    {
        $this->external_id_bidx = app(BlindIndex::class)->forExternalActivityId(
            $this->athlete_id,
            $this->provider,
            $this->external_id,
        );
    }

    public function trainingSession(): BelongsTo
    {
        return $this->belongsTo(TrainingSession::class);
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(User::class, 'athlete_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('activity')
            ->logOnly([
                'training_session_id',
                'athlete_id',
                'provider',
                'external_id',
                'sport',
                'started_at',
                'duration_seconds',
                'distance_meters',
                'elevation_gain_meters',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
