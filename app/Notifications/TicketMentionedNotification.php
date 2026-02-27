<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketMention;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TicketMentionedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Ticket $ticket,
        private readonly User $mentionedBy,
        private readonly TicketMention $mention,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event' => 'ticket_mentioned',
            'ticket_id' => $this->ticket->id,
            'ticket_title' => $this->ticket->title,
            'mentioned_by' => [
                'id' => $this->mentionedBy->id,
                'name' => $this->mentionedBy->fullName(),
                'email' => $this->mentionedBy->email,
            ],
            'mention_id' => $this->mention->id,
            'source' => $this->mention->source,
            'url' => '/admin/tickets?ticket='.$this->ticket->id,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
