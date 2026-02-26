<?php

namespace App\Models;

use App\Enums\GoalPriority;
use App\Enums\GoalSport;
use App\Enums\GoalStatus;
use App\Enums\GoalType;
use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Goal extends Model
{
    /** @use HasFactory<\Database\Factories\GoalFactory> */
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
        'type',
        'sport',
        'title',
        'description',
        'target_date',
        'priority',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => GoalType::class,
            'sport' => GoalSport::class,
            'priority' => GoalPriority::class,
            'status' => GoalStatus::class,
            'target_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
