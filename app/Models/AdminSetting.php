<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminSetting extends Model
{
    use HasFactory;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'scope',
        'ticket_archive_delay_hours',
    ];

    public static function tickets(): self
    {
        return static::query()->firstOrCreate(
            ['scope' => 'tickets'],
            ['ticket_archive_delay_hours' => (int) config('tickets.archive_delay_hours', 24)],
        );
    }
}
