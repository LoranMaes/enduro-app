<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AthleteProfile extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'birthdate',
        'weight',
        'height',
        'primary_sport',
        'weekly_training_days',
        'preferred_rest_day',
        'intensity_distribution',
        'ftp_watts',
        'max_heart_rate_bpm',
        'threshold_heart_rate_bpm',
        'threshold_pace_seconds_per_km',
        'power_zones',
        'heart_rate_zones',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'weight' => 'float',
            'height' => 'float',
            'weekly_training_days' => 'int',
            'ftp_watts' => 'int',
            'max_heart_rate_bpm' => 'int',
            'threshold_heart_rate_bpm' => 'int',
            'threshold_pace_seconds_per_km' => 'int',
            'power_zones' => 'array',
            'heart_rate_zones' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
