import {
    AlertCircle,
    CheckCircle2,
    CircleDot,
    LoaderCircle,
} from 'lucide-react';
import { useCallback, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { statusColumns } from '../constants';
import { useTicketDetailState } from '../hooks/useTicketDetailState';
import {
    type TicketMutationResult,
    type TicketUpdatePayload,
} from '../hooks/useTicketMutations';
import { formatDateTime } from '../lib/ticket-utils';
import type {
    AdminOption,
    TicketAudit,
    TicketRecord,
    TicketStatusKey,
    UserSearchResult,
} from '../types';
import { TicketDetailAuditTab } from './TicketDetailAuditTab';
import { TicketDetailOverviewTab } from './TicketDetailOverviewTab';

type TicketDetailSheetProps = {
    open: boolean;
    ticket: TicketRecord | null;
    admins: AdminOption[];
    onOpenChange: (open: boolean) => void;
    onTicketChange: (ticket: TicketRecord | null) => void;
    onMoveStatus: (
        ticketId: number,
        status: TicketStatusKey,
    ) => Promise<TicketRecord | null>;
    onUpdateTicket: (
        ticketId: number,
        payload: TicketUpdatePayload,
    ) => Promise<TicketMutationResult<TicketRecord>>;
    onUpsertInternalNote: (
        ticketId: number,
        content: string,
    ) => Promise<TicketMutationResult<TicketRecord>>;
    onUploadAttachment: (
        ticketId: number,
        file: File,
    ) => Promise<TicketRecord | null>;
    onRemoveAttachment: (
        ticketId: number,
        attachmentId: number,
    ) => Promise<TicketRecord | null>;
    onLoadAuditLogs: (ticketId: number) => Promise<TicketAudit[]>;
    searchUsers: (query: string) => Promise<UserSearchResult[]>;
};

export function TicketDetailSheet({
    open,
    ticket,
    admins,
    onOpenChange,
    onTicketChange,
    onMoveStatus,
    onUpdateTicket,
    onUpsertInternalNote,
    onUploadAttachment,
    onRemoveAttachment,
    onLoadAuditLogs,
    searchUsers,
}: TicketDetailSheetProps) {
    const [ticketAuditLogs, setTicketAuditLogs] = useState<TicketAudit[]>([]);
    const [ticketAuditLoading, setTicketAuditLoading] = useState(false);
    const [ticketAttachmentUploading, setTicketAttachmentUploading] =
        useState(false);

    const {
        ticketTitleDraft,
        setTicketTitleDraft,
        ticketTypeDraft,
        setTicketTypeDraft,
        ticketImportanceDraft,
        setTicketImportanceDraft,
        ticketAssigneeDraftId,
        setTicketAssigneeDraftId,
        ticketDetailError,
        ticketDetailFieldErrors,
        ticketDetailTab,
        setTicketDetailTab,
        ticketInternalNote,
        setTicketInternalNote,
        ticketDetailDescriptionHtml,
        ticketSyncState,
        ticketSyncMessage,
        clearFieldError,
        clearError,
        handleDescriptionChange,
    } = useTicketDetailState({
        open,
        ticket,
        onTicketChange,
        onUpdateTicket,
        onUpsertInternalNote,
    });

    const handleUploadAttachment = useCallback(
        async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
            if (ticket === null) {
                return;
            }

            const file = event.target.files?.[0];

            if (file === undefined) {
                return;
            }

            setTicketAttachmentUploading(true);

            try {
                const updatedTicket = await onUploadAttachment(ticket.id, file);

                if (updatedTicket !== null) {
                    onTicketChange(updatedTicket);
                }
            } finally {
                setTicketAttachmentUploading(false);
                event.target.value = '';
            }
        },
        [onTicketChange, onUploadAttachment, ticket],
    );

    const handleRemoveAttachment = useCallback(
        async (attachmentId: number): Promise<void> => {
            if (ticket === null) {
                return;
            }

            const updatedTicket = await onRemoveAttachment(
                ticket.id,
                attachmentId,
            );

            if (updatedTicket !== null) {
                onTicketChange(updatedTicket);
            }
        },
        [onRemoveAttachment, onTicketChange, ticket],
    );

    const handleLoadAuditLogs = useCallback(async (): Promise<void> => {
        if (ticket === null) {
            return;
        }

        setTicketAuditLoading(true);

        try {
            const logs = await onLoadAuditLogs(ticket.id);
            setTicketAuditLogs(logs);
        } finally {
            setTicketAuditLoading(false);
        }
    }, [onLoadAuditLogs, ticket]);

    const handleMoveStatus = useCallback(
        async (status: TicketStatusKey): Promise<void> => {
            if (ticket === null) {
                return;
            }

            const updatedTicket = await onMoveStatus(ticket.id, status);

            if (updatedTicket !== null) {
                onTicketChange(updatedTicket);
            }
        },
        [onMoveStatus, onTicketChange, ticket],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="xl"
                className="h-[min(92dvh,57.5rem)] max-w-[min(98vw,87.5rem)] overflow-hidden border-border bg-surface p-0"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Ticket Details</DialogTitle>
                    <DialogDescription>
                        View and edit ticket details, status, attachments,
                        internal notes, and audit trail.
                    </DialogDescription>
                </DialogHeader>

                {ticket === null ? null : (
                    <div className="flex h-full min-h-0 min-w-0 flex-col">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-medium text-zinc-100">
                                        Ticket #{ticket.id}
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        Created{' '}
                                        {formatDateTime(ticket.created_at)}
                                    </p>
                                </div>
                                <Tabs
                                    value={ticketDetailTab}
                                    onValueChange={(nextTab) => {
                                        const resolvedTab =
                                            nextTab === 'audit'
                                                ? 'audit'
                                                : 'overview';

                                        setTicketDetailTab(resolvedTab);

                                        if (resolvedTab === 'audit') {
                                            void handleLoadAuditLogs();
                                        }
                                    }}
                                >
                                    <TabsList className="mr-8 border-border bg-background p-1">
                                        <TabsTrigger
                                            value="overview"
                                            className="text-xs"
                                        >
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="audit"
                                            className="text-xs"
                                        >
                                            Audit Trail
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <p className="mr-1 text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                    Status
                                </p>
                                <ToggleGroup
                                    type="single"
                                    value={ticket.status}
                                    onValueChange={(value) => {
                                        if (value === '') {
                                            return;
                                        }

                                        void handleMoveStatus(
                                            value as TicketStatusKey,
                                        );
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-none bg-transparent"
                                    aria-label="Ticket status"
                                >
                                    {statusColumns.map((statusColumn) => (
                                        <ToggleGroupItem
                                            key={statusColumn.key}
                                            value={statusColumn.key}
                                            className="h-auto rounded-md border-zinc-800 px-2.5 py-1 text-xs whitespace-nowrap text-zinc-400 transition-colors hover:border-zinc-700 data-[state=on]:border-emerald-600 data-[state=on]:bg-emerald-950/25 data-[state=on]:text-emerald-300"
                                        >
                                            {statusColumn.label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        </div>

                        {ticketDetailTab === 'overview' ? (
                            <TicketDetailOverviewTab
                                ticket={ticket}
                                admins={admins}
                                title={ticketTitleDraft}
                                type={ticketTypeDraft}
                                importance={ticketImportanceDraft}
                                assigneeAdminId={ticketAssigneeDraftId}
                                descriptionHtml={ticketDetailDescriptionHtml}
                                internalNote={ticketInternalNote}
                                fieldErrors={ticketDetailFieldErrors}
                                attachmentUploading={ticketAttachmentUploading}
                                onTitleChange={setTicketTitleDraft}
                                onTypeChange={setTicketTypeDraft}
                                onImportanceChange={setTicketImportanceDraft}
                                onAssigneeChange={setTicketAssigneeDraftId}
                                onDescriptionChange={handleDescriptionChange}
                                onInternalNoteChange={setTicketInternalNote}
                                onClearFieldError={clearFieldError}
                                onClearError={clearError}
                                onUploadAttachment={(event) => {
                                    void handleUploadAttachment(event);
                                }}
                                onRemoveAttachment={(attachmentId) => {
                                    void handleRemoveAttachment(attachmentId);
                                }}
                                searchUsers={searchUsers}
                            />
                        ) : (
                            <TicketDetailAuditTab
                                loading={ticketAuditLoading}
                                logs={ticketAuditLogs}
                            />
                        )}

                        {ticketDetailError !== null ? (
                            <div className="border-t border-red-900/50 bg-red-950/20 px-5 py-2 text-xs text-red-300">
                                {ticketDetailError}
                            </div>
                        ) : null}

                        {ticketDetailTab === 'overview' ? (
                            <div className="border-t border-border px-5 py-3">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            onOpenChange(false);
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {ticketDetailTab === 'overview' ? (
                            <div className="pointer-events-none absolute bottom-4 left-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 py-1 text-[0.6875rem] text-zinc-400">
                                {ticketSyncState === 'syncing' ||
                                ticketSyncState === 'dirty' ? (
                                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-zinc-300" />
                                ) : ticketSyncState === 'saved' ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : ticketSyncState === 'error' ? (
                                    <AlertCircle className="h-3.5 w-3.5 text-red-300" />
                                ) : (
                                    <CircleDot className="h-3.5 w-3.5 text-zinc-500" />
                                )}
                                <span>{ticketSyncMessage}</span>
                            </div>
                        ) : null}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
