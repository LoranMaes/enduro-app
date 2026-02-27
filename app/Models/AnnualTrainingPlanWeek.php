<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnualTrainingPlanWeek extends Model
{
    /** @use HasFactory<\Database\Factories\AnnualTrainingPlanWeekFactory> */
    use HasFactory;

    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'annual_training_plan_id',
        'annual_training_plan_uuid_id',
        'week_start_date',
        'week_type',
        'priority',
        'notes',
        'planned_minutes',
        'completed_minutes',
        'planned_tss',
        'completed_tss',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start_date' => 'date',
            'planned_minutes' => 'integer',
            'completed_minutes' => 'integer',
            'planned_tss' => 'integer',
            'completed_tss' => 'integer',
        ];
    }

    public function annualTrainingPlan(): BelongsTo
    {
        return $this->belongsTo(AnnualTrainingPlan::class);
    }
}
