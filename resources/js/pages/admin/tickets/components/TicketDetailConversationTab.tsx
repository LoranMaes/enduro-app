import { MessageCircle, Paperclip, Send } from 'lucide-react';
import { type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '../lib/ticket-utils';
import type { TicketRecord } from '../types';

type TicketDetailConversationTabProps = {
    ticket: TicketRecord;
    messageDraft: string;
    messageSubmitting: boolean;
    messageError: string | null;
    messageFieldError: string | null;
    attachmentUploading: boolean;
    onMessageChange: (value: string) => void;
    onSendMessage: () => void;
    onUploadAttachment: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (attachmentId: number) => void;
};

export function TicketDetailConversationTab({
    ticket,
    messageDraft,
    messageSubmitting,
    messageError,
    messageFieldError,
    attachmentUploading,
    onMessageChange,
    onSendMessage,
    onUploadAttachment,
    onRemoveAttachment,
}: TicketDetailConversationTabProps) {
    return (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-h-0 flex-col rounded-lg border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                            Conversation
                        </p>
                        {ticket.has_admin_response ? (
                            <span className="text-[0.6875rem] text-emerald-300">
                                Responded
                            </span>
                        ) : (
                            <span className="text-[0.6875rem] text-zinc-500">
                                Waiting for first admin response
                            </span>
                        )}
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                    {ticket.messages.length === 0 ? (
                        <div className="flex h-full min-h-40 items-center justify-center text-sm text-zinc-500">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            No messages yet.
                        </div>
                    ) : (
                        ticket.messages.map((message) => (
                            <article
                                key={message.id}
                                className={`max-w-[85%] rounded-lg border px-3 py-2 ${
                                    message.is_admin_author
                                        ? 'ml-auto border-sky-900/60 bg-sky-950/20'
                                        : 'border-zinc-800 bg-zinc-900/40'
                                }`}
                            >
                                <p className="text-xs text-zinc-300">
                                    {message.author?.name ?? 'Unknown'}
                                    <span className="ml-2 text-zinc-500">
                                        {formatDateTime(message.created_at)}
                                    </span>
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">
                                    {message.body}
                                </p>
                            </article>
                        ))
                    )}
                </div>

                <div className="border-t border-border px-4 py-3">
                    <Label className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                        Reply
                    </Label>
                    <Textarea
                        value={messageDraft}
                        onChange={(event) => onMessageChange(event.target.value)}
                        className="mt-2 min-h-24 bg-zinc-950"
                        placeholder={
                            ticket.status === 'done'
                                ? 'Resolved tickets are locked.'
                                : 'Write a reply to the reporter...'
                        }
                        disabled={ticket.status === 'done' || messageSubmitting}
                    />
                    {messageFieldError !== null ? (
                        <p className="mt-2 text-xs text-red-300">
                            {messageFieldError}
                        </p>
                    ) : null}
                    {messageError !== null ? (
                        <p className="mt-2 text-xs text-red-300">
                            {messageError}
                        </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between">
                        {ticket.status === 'done' ? (
                            <p className="text-xs text-zinc-500">
                                This ticket is resolved. New replies are locked.
                            </p>
                        ) : (
                            <p className="text-xs text-zinc-500">
                                Send updates so the reporter can follow progress.
                            </p>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            onClick={onSendMessage}
                            disabled={
                                ticket.status === 'done' ||
                                messageSubmitting ||
                                messageDraft.trim() === ''
                            }
                        >
                            <Send className="mr-1.5 h-4 w-4" />
                            {messageSubmitting ? 'Sending...' : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>

            <aside className="flex min-h-0 flex-col rounded-lg border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                        Files
                    </p>
                </div>
                <div className="space-y-2 overflow-y-auto px-4 py-3">
                    {ticket.attachments.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                            No files uploaded.
                        </p>
                    ) : (
                        ticket.attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="rounded border border-zinc-800 px-2 py-1.5"
                            >
                                <a
                                    href={attachment.download_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-zinc-300 transition-colors hover:text-white"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    <span className="truncate">
                                        {attachment.display_name}
                                        {attachment.extension !== null
                                            ? `.${attachment.extension}`
                                            : ''}
                                    </span>
                                </a>
                                <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-zinc-500">
                                    <span>
                                        {(attachment.uploaded_by_user?.name ??
                                            attachment.uploaded_by_admin
                                                ?.name ??
                                            'Unknown')}
                                    </span>
                                    <button
                                        type="button"
                                        className="transition-colors hover:text-red-300"
                                        onClick={() =>
                                            onRemoveAttachment(attachment.id)
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t border-border px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 transition-colors hover:bg-zinc-700">
                        {attachmentUploading ? 'Uploading...' : 'Upload file'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={onUploadAttachment}
                            disabled={attachmentUploading || ticket.status === 'done'}
                        />
                    </label>
                    <p className="mt-2 text-[0.6875rem] text-zinc-500">
                        User tickets allow up to 5 files and 10MB per file.
                    </p>
                </div>
            </aside>
        </div>
    );
}
