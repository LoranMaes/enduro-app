<?php

namespace App\Models;

use App\Models\Concerns\UsesDualUuidIdentity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAttachment extends Model
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
        'uploaded_by_admin_id',
        'uploaded_by_admin_uuid_id',
        'uploaded_by_user_id',
        'uploaded_by_user_uuid_id',
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

    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
