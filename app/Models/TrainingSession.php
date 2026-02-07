<?php

namespace App\Models;

use App\Enums\TrainingSessionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TrainingSession extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'training_week_id',
        'scheduled_date',
        'sport',
        'status',
        'duration_minutes',
        'planned_tss',
        'actual_tss',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'status' => TrainingSessionStatus::class,
        ];
    }

    public function trainingWeek(): BelongsTo
    {
        return $this->belongsTo(TrainingWeek::class);
    }

    public function activity(): HasOne
    {
        return $this->hasOne(Activity::class);
    }
}
