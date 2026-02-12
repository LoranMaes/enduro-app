<?php

namespace App\Models;

use App\Concerns\LogsModelActivity;
use App\Enums\TrainingSessionCompletionSource;
use App\Enums\TrainingSessionPlanningSource;
use App\Enums\TrainingSessionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TrainingSession extends Model
{
    use HasFactory;
    use LogsModelActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'training_week_id',
        'scheduled_date',
        'sport',
        'title',
        'status',
        'planning_source',
        'completion_source',
        'duration_minutes',
        'actual_duration_minutes',
        'planned_tss',
        'actual_tss',
        'completed_at',
        'auto_completed_at',
        'notes',
        'planned_structure',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'status' => TrainingSessionStatus::class,
            'planning_source' => TrainingSessionPlanningSource::class,
            'completion_source' => TrainingSessionCompletionSource::class,
            'completed_at' => 'datetime',
            'auto_completed_at' => 'datetime',
            'planned_structure' => 'array',
        ];
    }

    public function trainingWeek(): BelongsTo
    {
        return $this->belongsTo(TrainingWeek::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function activity(): HasOne
    {
        return $this->hasOne(Activity::class);
    }
}
