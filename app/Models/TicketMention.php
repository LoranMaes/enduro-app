<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMention extends Model
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
        'ticket_comment_id',
        'ticket_comment_uuid_id',
        'mentioned_admin_id',
        'mentioned_admin_uuid_id',
        'mentioned_by_admin_id',
        'mentioned_by_admin_uuid_id',
        'source',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function ticketComment(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class);
    }

    public function mentionedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentioned_admin_id');
    }

    public function mentionedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentioned_by_admin_id');
    }
}
