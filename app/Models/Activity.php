<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Activity extends Model
{
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'training_session_id',
        'athlete_id',
        'provider',
        'external_id',
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
            'raw_payload' => 'array',
        ];
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
