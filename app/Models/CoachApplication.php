<?php

namespace App\Models;

use App\Concerns\LogsModelActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CoachApplication extends Model
{
    use HasFactory;
    use LogsModelActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'status',
        'coaching_experience',
        'specialties',
        'certifications_summary',
        'website_url',
        'motivation',
        'review_notes',
        'submitted_at',
        'reviewed_at',
        'reviewed_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(CoachApplicationFile::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
