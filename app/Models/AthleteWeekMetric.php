<?php

namespace App\Models;

use App\Enums\AthleteWeekLoadState;
use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AthleteWeekMetric extends Model
{
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
        'week_start_date',
        'week_end_date',
        'planned_sessions_count',
        'planned_completed_count',
        'planned_minutes_total',
        'completed_minutes_total',
        'planned_tss_total',
        'completed_tss_total',
        'load_state',
        'load_state_ratio',
        'load_state_source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start_date' => 'date',
            'week_end_date' => 'date',
            'load_state' => AthleteWeekLoadState::class,
            'load_state_ratio' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
