<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMention extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ticket_id',
        'ticket_comment_id',
        'mentioned_admin_id',
        'mentioned_by_admin_id',
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
