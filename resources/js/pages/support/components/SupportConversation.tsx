import { MessageCircle } from 'lucide-react';
import { formatDateTime } from '@/pages/admin/tickets/lib/ticket-utils';
import type { SupportTicketMessage } from '../types';

type SupportConversationProps = {
    messages: SupportTicketMessage[];
};

export function SupportConversation({ messages }: SupportConversationProps) {
    if (messages.length === 0) {
        return (
            <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background text-sm text-zinc-500">
                <MessageCircle className="mr-2 h-4 w-4" />
                No conversation yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {messages.map((message) => (
                <article
                    key={message.id}
                    className={`max-w-[88%] rounded-lg border px-3 py-2 ${
                        message.is_admin_author
                            ? 'border-sky-900/60 bg-sky-950/20'
                            : 'ml-auto border-zinc-700 bg-zinc-900/50'
                    }`}
                >
                    <p className="text-xs text-zinc-400">
                        {message.author?.name ?? 'Unknown'} ·{' '}
                        {formatDateTime(message.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">
                        {message.body}
                    </p>
                </article>
            ))}
        </div>
    );
}
