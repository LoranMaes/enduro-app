import { Archive, Paperclip } from 'lucide-react';
import { type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDuration } from '../lib/ticket-utils';
import type {
    AdminOption,
    RequestFieldErrors,
    TicketImportance,
    TicketRecord,
    TicketType,
    UserSearchResult,
} from '../types';
import {
    TicketDescriptionEditor,
    type TicketDescriptionValue,
} from './ticket-description-editor';
import { SelectField } from './ticket-ui';

type TicketDetailOverviewTabProps = {
    ticket: TicketRecord;
    admins: AdminOption[];
    title: string;
    type: TicketType;
    importance: TicketImportance;
    assigneeAdminId: number | null;
    descriptionHtml: string;
    internalNote: string;
    fieldErrors: RequestFieldErrors;
    attachmentUploading: boolean;
    onTitleChange: (value: string) => void;
    onTypeChange: (value: TicketType) => void;
    onImportanceChange: (value: TicketImportance) => void;
    onAssigneeChange: (value: number | null) => void;
    onDescriptionChange: (value: TicketDescriptionValue) => void;
    onInternalNoteChange: (value: string) => void;
    onClearFieldError: (field: string) => void;
    onClearError: () => void;
    onUploadAttachment: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (attachmentId: number) => void;
    searchUsers: (query: string) => Promise<UserSearchResult[]>;
};

export function TicketDetailOverviewTab({
    ticket,
    admins,
    title,
    type,
    importance,
    assigneeAdminId,
    descriptionHtml,
    internalNote,
    fieldErrors,
    attachmentUploading,
    onTitleChange,
    onTypeChange,
    onImportanceChange,
    onAssigneeChange,
    onDescriptionChange,
    onInternalNoteChange,
    onClearFieldError,
    onClearError,
    onUploadAttachment,
    onRemoveAttachment,
    searchUsers,
}: TicketDetailOverviewTabProps) {
    return (
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-5">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                <div className="space-y-1">
                    <Label htmlFor="detail-title">Title</Label>
                    <Input
                        id="detail-title"
                        value={title}
                        onChange={(event) => {
                            onTitleChange(event.target.value);
                            onClearError();
                            onClearFieldError('title');
                        }}
                    />
                    {fieldErrors.title !== undefined ? (
                        <p className="text-xs text-red-300">
                            {fieldErrors.title[0]}
                        </p>
                    ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <SelectField
                        label="Type"
                        value={type}
                        onChange={(value) => {
                            onTypeChange(value as TicketType);
                            onClearError();
                            onClearFieldError('type');
                        }}
                        options={[
                            { value: 'bug', label: 'Bug' },
                            { value: 'feature', label: 'Feature' },
                            { value: 'chore', label: 'Chore' },
                            { value: 'support', label: 'Support' },
                        ]}
                    />
                    <SelectField
                        label="Importance"
                        value={importance}
                        onChange={(value) => {
                            onImportanceChange(value as TicketImportance);
                            onClearError();
                            onClearFieldError('importance');
                        }}
                        options={[
                            { value: 'low', label: 'Low' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'high', label: 'High' },
                            { value: 'urgent', label: 'Urgent' },
                        ]}
                    />
                    <SelectField
                        label="Assignee"
                        value={String(assigneeAdminId ?? 0)}
                        onChange={(value) => {
                            onAssigneeChange(Number.parseInt(value, 10) || null);
                            onClearError();
                            onClearFieldError('assignee_admin_id');
                        }}
                        options={[
                            { value: '0', label: 'Unassigned' },
                            ...admins.map((admin) => ({
                                value: String(admin.id),
                                label: admin.name,
                            })),
                        ]}
                    />
                </div>
                {fieldErrors.type !== undefined ||
                fieldErrors.importance !== undefined ||
                fieldErrors.assignee_admin_id !== undefined ? (
                    <div className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                        {fieldErrors.type?.[0] ??
                            fieldErrors.importance?.[0] ??
                            fieldErrors.assignee_admin_id?.[0]}
                    </div>
                ) : null}

                <TicketDescriptionEditor
                    label="Description"
                    html={descriptionHtml}
                    placeholder="Update details, mention @admins, and reference /user results."
                    admins={admins}
                    searchUsers={searchUsers}
                    onChange={(value: TicketDescriptionValue) => {
                        onDescriptionChange(value);
                        onClearError();
                        onClearFieldError('description');
                    }}
                />
                {fieldErrors.description !== undefined ? (
                    <p className="text-xs text-red-300">
                        {fieldErrors.description[0]}
                    </p>
                ) : null}

                <div className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-300 uppercase">
                            Attachments
                        </p>
                        <label className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[0.6875rem] text-zinc-200 transition-colors hover:bg-zinc-700">
                            {attachmentUploading ? 'Uploading...' : 'Upload'}
                            <input
                                type="file"
                                className="hidden"
                                onChange={onUploadAttachment}
                                disabled={attachmentUploading}
                            />
                        </label>
                    </div>
                    <div className="space-y-2">
                        {ticket.attachments.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                                No attachments yet.
                            </p>
                        ) : (
                            ticket.attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center justify-between gap-3 rounded border border-zinc-800 px-2 py-1"
                                >
                                    <a
                                        href={attachment.download_url}
                                        target="_blank"
                                        className="inline-flex min-w-0 items-center gap-1 text-xs text-zinc-300 transition-colors hover:text-white"
                                        rel="noreferrer"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        <span className="truncate">
                                            {attachment.display_name}
                                            {attachment.extension !== null
                                                ? `.${attachment.extension}`
                                                : ''}
                                        </span>
                                    </a>
                                    <button
                                        type="button"
                                        className="text-[0.6875rem] text-zinc-500 transition-colors hover:text-red-300"
                                        onClick={() => {
                                            onRemoveAttachment(attachment.id);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <aside className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto rounded-xl border border-border bg-background p-4">
                <div className="rounded-lg border border-zinc-800 px-3 py-2">
                    <p className="text-[0.6875rem] text-zinc-500 uppercase">
                        Creator
                    </p>
                    <p className="text-xs text-zinc-300">
                        {ticket.creator_admin?.name ?? 'Unknown'}
                    </p>
                </div>

                <div className="rounded-lg border border-zinc-800 px-3 py-2">
                    <p className="text-[0.6875rem] text-zinc-500 uppercase">
                        Archived
                    </p>
                    {ticket.status === 'done' &&
                    ticket.archiving_in_seconds !== null ? (
                        <p className="inline-flex items-center gap-1 text-xs text-zinc-300">
                            <Archive className="h-3.5 w-3.5" />
                            In {formatDuration(ticket.archiving_in_seconds)}
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-500">Not scheduled</p>
                    )}
                </div>

                <div className="h-full space-y-2 rounded-lg border border-zinc-800 px-3 py-2">
                    <p className="text-[0.6875rem] text-zinc-500 uppercase">
                        Internal Notes (Private)
                    </p>
                    <Textarea
                        value={internalNote}
                        onChange={(event) => {
                            onInternalNoteChange(event.target.value);
                            onClearError();
                            onClearFieldError('content');
                        }}
                        className="min-h-32 bg-zinc-950"
                        placeholder="Only visible to you."
                    />
                    {fieldErrors.content !== undefined ? (
                        <p className="text-xs text-red-300">
                            {fieldErrors.content[0]}
                        </p>
                    ) : null}
                </div>
            </aside>
        </div>
    );
}
