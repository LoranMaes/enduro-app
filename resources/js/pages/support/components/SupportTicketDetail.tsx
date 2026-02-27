import { Clock3, MessageCircleMore } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { formatDateTime, formatDuration } from '@/pages/admin/tickets/lib/ticket-utils';
import type {
    SupportAttachmentLimits,
    SupportTicketAttachment,
    SupportTicketMessage,
    SupportTicketRecord,
    SupportTicketStatusLabels,
} from '../types';
import { SupportAttachmentsCard } from './SupportAttachmentsCard';
import { SupportComposer } from './SupportComposer';
import { SupportConversation } from './SupportConversation';
import { SupportStatusBadge } from './SupportStatusBadge';

type SupportTicketDetailProps = {
    ticket: SupportTicketRecord | null;
    statusLabels: SupportTicketStatusLabels;
    attachmentLimits: SupportAttachmentLimits;
    forceReadOnly?: boolean;
    conversationDraft: string;
    messageBusy: boolean;
    messageError: string | null;
    messageFieldError: string | null;
    attachmentBusy: boolean;
    onConversationDraftChange: (value: string) => void;
    onSendMessage: () => void;
    onUploadAttachment: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
};

function unwrapResourceCollection<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (
        typeof value === 'object' &&
        value !== null &&
        'data' in value &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return ((value as { data?: unknown[] }).data ?? []) as T[];
    }

    return [];
}

export function SupportTicketDetail({
    ticket,
    statusLabels,
    attachmentLimits,
    forceReadOnly = false,
    conversationDraft,
    messageBusy,
    messageError,
    messageFieldError,
    attachmentBusy,
    onConversationDraftChange,
    onSendMessage,
    onUploadAttachment,
}: SupportTicketDetailProps) {
    if (ticket === null) {
        return (
            <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-border bg-surface text-sm text-zinc-500">
                Select a ticket to view details.
            </div>
        );
    }

    const isResolved = ticket.status === 'done';
    const isComposerDisabled = isResolved || forceReadOnly;
    const normalizedMessages = unwrapResourceCollection<SupportTicketMessage>(
        ticket.messages,
    );
    const normalizedAttachments =
        unwrapResourceCollection<SupportTicketAttachment>(ticket.attachments);

    return (
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-medium text-zinc-100">
                            {ticket.title}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                            Created {formatDateTime(ticket.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SupportStatusBadge
                            status={ticket.status}
                            labels={statusLabels}
                        />
                        {ticket.has_admin_response ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                                <MessageCircleMore className="h-3.5 w-3.5" />
                                Responded
                            </span>
                        ) : null}
                    </div>
                </div>
                {isResolved && ticket.archiving_in_seconds !== null ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        Archived in {formatDuration(ticket.archiving_in_seconds)}
                    </p>
                ) : null}
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
                    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3">
                        <SupportConversation messages={normalizedMessages} />
                    </div>
                    <SupportComposer
                        value={conversationDraft}
                        busy={messageBusy}
                        disabled={isComposerDisabled}
                        error={messageError}
                        fieldError={messageFieldError}
                        onChange={onConversationDraftChange}
                        onSubmit={onSendMessage}
                    />
                </div>

                <SupportAttachmentsCard
                    attachments={normalizedAttachments}
                    limits={attachmentLimits}
                    uploading={attachmentBusy}
                    disabled={isComposerDisabled}
                    onUpload={onUploadAttachment}
                />
            </div>
        </section>
    );
}
