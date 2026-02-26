<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketInternalNote extends Model
{
    use HasFactory;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'ticket_id',
        'ticket_uuid_id',
        'admin_id',
        'admin_uuid_id',
        'content',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
