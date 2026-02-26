<?php

namespace App\Models;

use App\Models\Concerns\HasBlindIndexes;
use App\Models\Concerns\UsesDualUuidIdentity;
use App\Support\Ids\BlindIndex;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ActivityProviderConnection extends Model
{
    use HasBlindIndexes;
    use HasFactory;
    use LogsActivity;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'user_id',
        'user_uuid_id',
        'provider',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'provider_athlete_id',
        'provider_athlete_id_bidx',
        'last_synced_at',
        'last_sync_status',
        'last_sync_reason',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_token' => \App\Casts\EncryptedStringOrPlain::class,
            'refresh_token' => \App\Casts\EncryptedStringOrPlain::class,
            'token_expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'provider_athlete_id' => \App\Casts\EncryptedStringOrPlain::class,
        ];
    }

    public function syncBlindIndexes(): void
    {
        $this->provider_athlete_id_bidx = app(BlindIndex::class)->forProviderAthleteId(
            $this->provider,
            $this->provider_athlete_id,
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('activity_provider_connection')
            ->logOnly([
                'user_id',
                'provider',
                'provider_athlete_id',
                'token_expires_at',
                'last_synced_at',
                'last_sync_status',
                'last_sync_reason',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
