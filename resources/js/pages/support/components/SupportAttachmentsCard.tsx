import { Paperclip } from 'lucide-react';
import { type ChangeEvent } from 'react';
import type {
    SupportAttachmentLimits,
    SupportTicketAttachment,
} from '../types';

type SupportAttachmentsCardProps = {
    attachments: SupportTicketAttachment[];
    limits: SupportAttachmentLimits;
    uploading: boolean;
    disabled: boolean;
    onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function SupportAttachmentsCard({
    attachments,
    limits,
    uploading,
    disabled,
    onUpload,
}: SupportAttachmentsCardProps) {
    return (
        <aside className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                    Files
                </p>
                <label className="inline-flex cursor-pointer items-center rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-700">
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={onUpload}
                        disabled={uploading || disabled}
                    />
                </label>
            </div>
            <div className="space-y-2">
                {attachments.length === 0 ? (
                    <p className="text-xs text-zinc-500">No files uploaded.</p>
                ) : (
                    attachments.map((attachment) => (
                        <a
                            key={attachment.id}
                            href={attachment.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="truncate">
                                {attachment.display_name}
                                {attachment.extension !== null
                                    ? `.${attachment.extension}`
                                    : ''}
                            </span>
                        </a>
                    ))
                )}
            </div>
            <p className="mt-3 text-[0.6875rem] text-zinc-500">
                Max {limits.max_files_per_ticket} files,{' '}
                {(limits.max_file_size_kb / 1024).toFixed(0)}MB each.
            </p>
        </aside>
    );
}
