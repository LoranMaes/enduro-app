<?php

namespace App\Models;

use App\Concerns\LogsModelActivity;
use App\Enums\TicketImportance;
use App\Enums\TicketSource;
use App\Enums\TicketStatus;
use App\Enums\TicketType;
use App\Models\Concerns\UsesDualUuidIdentity;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;
    use LogsModelActivity;
    use UsesDualUuidIdentity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid_id',
        'public_id',
        'title',
        'description',
        'source',
        'status',
        'type',
        'importance',
        'assignee_admin_id',
        'assignee_admin_uuid_id',
        'creator_admin_id',
        'creator_admin_uuid_id',
        'reporter_user_id',
        'reporter_user_uuid_id',
        'first_admin_response_at',
        'done_at',
        'archived_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'description' => 'array',
            'source' => TicketSource::class,
            'status' => TicketStatus::class,
            'type' => TicketType::class,
            'importance' => TicketImportance::class,
            'first_admin_response_at' => 'datetime',
            'done_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function assigneeAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_admin_id');
    }

    public function creatorAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_admin_id');
    }

    public function reporterUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function internalNotes(): HasMany
    {
        return $this->hasMany(TicketInternalNote::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class);
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(TicketMention::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(TicketAuditLog::class);
    }

    public function isDone(): bool
    {
        return $this->status === TicketStatus::Done;
    }

    public function isUserSource(): bool
    {
        return $this->source === TicketSource::User;
    }

    public function archiveDeadlineHours(int $delayHours): ?CarbonInterface
    {
        if ($this->done_at === null) {
            return null;
        }

        return $this->done_at->copy()->addHours($delayHours);
    }

    public function leaveDoneState(): void
    {
        $this->forceFill([
            'done_at' => null,
            'archived_at' => null,
        ]);
    }
}
