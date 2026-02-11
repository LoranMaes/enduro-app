<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAttachment extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ticket_id',
        'uploaded_by_admin_id',
        'original_name',
        'display_name',
        'extension',
        'mime_type',
        'size_bytes',
        'stored_disk',
        'stored_path',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function uploadedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_admin_id');
    }
}
