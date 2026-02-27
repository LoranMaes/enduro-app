import {
    type ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Plus } from 'lucide-react';
import { FeatureLockedCard } from '@/components/feature-locked-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
    SupportAttachmentLimits,
    SupportRequestFieldErrors,
    SupportTicketBuckets,
    SupportTicketRecord,
    SupportTicketStatusLabels,
} from './types';
import { SupportTicketDetail } from './components/SupportTicketDetail';
import { SupportCreateTicketDialog } from './components/SupportCreateTicketDialog';
import { SupportTicketList } from './components/SupportTicketList';
import { useSupportTicketsData } from './hooks/useSupportTicketsData';
import { useSupportTicketMutations } from './hooks/useSupportTicketMutations';
import { useSupportTicketSelection } from './hooks/useSupportTicketSelection';

type SupportPageProps = {
    isLocked: boolean;
    initialTickets: SupportTicketBuckets;
    statusLabels: SupportTicketStatusLabels;
    attachmentLimits: SupportAttachmentLimits;
};

export function SupportPage({
    isLocked,
    initialTickets,
    statusLabels,
    attachmentLimits,
}: SupportPageProps) {
    const {
        activeTab,
        setActiveTab,
        visibleTickets,
        loading,
        upsertTicket,
    } = useSupportTicketsData({
        initialTickets,
    });
    const { selectedTicketId, setSelectedTicketId } = useSupportTicketSelection({
        visibleTickets,
    });
    const { fetchTicket, createTicket, createMessage, uploadAttachment } =
        useSupportTicketMutations();
    const [createOpen, setCreateOpen] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [createType, setCreateType] = useState<'bug' | 'feature' | 'support'>(
        'bug',
    );
    const [createTitle, setCreateTitle] = useState('');
    const [createMessageText, setCreateMessageText] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [createFieldErrors, setCreateFieldErrors] =
        useState<SupportRequestFieldErrors>({});
    const [conversationDraft, setConversationDraft] = useState('');
    const [messageBusy, setMessageBusy] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const [messageFieldError, setMessageFieldError] = useState<string | null>(
        null,
    );
    const [attachmentBusy, setAttachmentBusy] = useState(false);

    const selectedTicket = useMemo<SupportTicketRecord | null>(
        () =>
            visibleTickets.find((ticket) => ticket.id === selectedTicketId) ??
            null,
        [selectedTicketId, visibleTickets],
    );

    useEffect(() => {
        if (isLocked) {
            return;
        }

        if (selectedTicketId === null) {
            return;
        }

        let cancelled = false;

        void (async () => {
            const ticket = await fetchTicket(selectedTicketId);

            if (cancelled || ticket === null) {
                return;
            }

            upsertTicket(ticket);
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchTicket, isLocked, selectedTicketId, upsertTicket]);

    const handleCreateTicket = useCallback(async (): Promise<void> => {
        if (isLocked) {
            return;
        }

        setCreateBusy(true);
        setCreateError(null);
        setCreateFieldErrors({});

        try {
            const response = await createTicket({
                title: createTitle.trim(),
                type: createType,
                message: createMessageText.trim(),
            });

            if (!response.ok || response.data === null) {
                setCreateError(response.message);
                setCreateFieldErrors(response.fieldErrors);
                return;
            }

            upsertTicket(response.data);
            setActiveTab('active');
            setSelectedTicketId(response.data.id);
            setCreateOpen(false);
            setCreateTitle('');
            setCreateType('bug');
            setCreateMessageText('');
        } finally {
            setCreateBusy(false);
        }
    }, [
        createMessageText,
        createTicket,
        createTitle,
        createType,
        isLocked,
        setActiveTab,
        setSelectedTicketId,
        upsertTicket,
    ]);

    const handleSendMessage = useCallback(async (): Promise<void> => {
        if (isLocked) {
            return;
        }

        if (selectedTicket === null || conversationDraft.trim() === '') {
            return;
        }

        setMessageBusy(true);
        setMessageError(null);
        setMessageFieldError(null);

        try {
            const response = await createMessage(
                selectedTicket.id,
                conversationDraft.trim(),
            );

            if (!response.ok || response.data === null) {
                setMessageError(response.message);
                setMessageFieldError(response.fieldErrors.body?.[0] ?? null);
                return;
            }

            upsertTicket(response.data);
            setConversationDraft('');
        } finally {
            setMessageBusy(false);
        }
    }, [conversationDraft, createMessage, isLocked, selectedTicket, upsertTicket]);

    const handleUploadAttachment = useCallback(
        async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
            if (isLocked) {
                return;
            }

            if (selectedTicket === null) {
                return;
            }

            const file = event.target.files?.[0];

            if (file === undefined) {
                return;
            }

            setAttachmentBusy(true);
            setMessageError(null);
            setMessageFieldError(null);

            try {
                const response = await uploadAttachment(selectedTicket.id, file);

                if (!response.ok || response.data === null) {
                    setMessageError(response.message);
                    setMessageFieldError(response.fieldErrors.file?.[0] ?? null);
                    return;
                }

                upsertTicket(response.data);
            } finally {
                setAttachmentBusy(false);
                event.target.value = '';
            }
        },
        [isLocked, selectedTicket, uploadAttachment, upsertTicket],
    );

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <header className="border-b border-border px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                            Help Center
                        </p>
                        <h1 className="mt-1 text-3xl font-medium text-zinc-100">
                            Support
                        </h1>
                        <p className="mt-2 text-xs text-zinc-500">
                            Report bugs, request features, and track replies from
                            the team.
                        </p>
                    </div>
                    {isLocked ? (
                        <Badge variant="outline" className="text-xs text-amber-300">
                            Premium preview
                        </Badge>
                    ) : null}
                    <Button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                            if (isLocked) {
                                return;
                            }

                            setCreateOpen(true);
                        }}
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        New ticket
                    </Button>
                </div>
            </header>

            <div className="relative min-h-0 flex-1">
                <div
                    className={`grid min-h-0 h-full grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-[22rem_minmax(0,1fr)] ${
                        isLocked
                            ? 'pointer-events-none select-none blur-sm saturate-50'
                            : ''
                    }`}
                >
                    <section className="min-h-0 overflow-y-auto">
                        <Tabs
                            value={activeTab}
                            onValueChange={(value) => {
                                setActiveTab(value === 'archived' ? 'archived' : 'active');
                            }}
                        >
                            <TabsList className="mb-3 grid w-full grid-cols-2 border-border bg-surface">
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="archived">Archived</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <SupportTicketList
                            tickets={visibleTickets}
                            selectedTicketId={selectedTicketId}
                            statusLabels={statusLabels}
                            loading={loading}
                            emptyMessage={
                                activeTab === 'active'
                                    ? 'No active support tickets.'
                                    : 'No archived tickets yet.'
                            }
                            onSelectTicket={setSelectedTicketId}
                        />
                    </section>

                    <SupportTicketDetail
                        ticket={selectedTicket}
                        statusLabels={statusLabels}
                        attachmentLimits={attachmentLimits}
                        conversationDraft={conversationDraft}
                        messageBusy={messageBusy}
                        messageError={messageError}
                        messageFieldError={messageFieldError}
                        attachmentBusy={attachmentBusy}
                        forceReadOnly={isLocked}
                        onConversationDraftChange={setConversationDraft}
                        onSendMessage={() => {
                            void handleSendMessage();
                        }}
                        onUploadAttachment={(event) => {
                            void handleUploadAttachment(event);
                        }}
                    />
                </div>

                {isLocked ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 py-6">
                        <div className="pointer-events-auto w-full max-w-md">
                            <FeatureLockedCard
                                title="Support is a premium feature"
                                description="Unlock direct support tickets, file uploads, and status tracking from the team."
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            <SupportCreateTicketDialog
                open={createOpen}
                busy={createBusy}
                type={createType}
                title={createTitle}
                message={createMessageText}
                error={createError}
                fieldErrors={createFieldErrors}
                onOpenChange={setCreateOpen}
                onTypeChange={(value) => {
                    setCreateType(value);
                    setCreateError(null);
                }}
                onTitleChange={(value) => {
                    setCreateTitle(value);
                    setCreateError(null);
                }}
                onMessageChange={(value) => {
                    setCreateMessageText(value);
                    setCreateError(null);
                }}
                onSubmit={() => {
                    void handleCreateTicket();
                }}
            />
        </div>
    );
}
