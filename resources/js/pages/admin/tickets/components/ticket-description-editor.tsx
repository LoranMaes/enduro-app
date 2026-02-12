import { router } from '@inertiajs/react';
import { EditorContent } from '@tiptap/react';
import { type MouseEvent, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { show as adminUserShow } from '@/routes/admin/users';
import { TicketDescriptionToolbar } from './ticket-description-editor/TicketDescriptionToolbar';
import { TicketSuggestionPopover } from './ticket-description-editor/TicketSuggestionPopover';
import {
    type TicketDescriptionEditorProps,
} from './ticket-description-editor/types';
import { useTicketDescriptionEditor } from './ticket-description-editor/useTicketDescriptionEditor';

export type {
    MentionableAdmin,
    MentionableUser,
    DescriptionUserRef,
    TicketDescriptionValue,
} from './ticket-description-editor/types';

export function TicketDescriptionEditor({
    label,
    html,
    placeholder,
    admins,
    className,
    onChange,
    searchUsers,
}: TicketDescriptionEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const {
        editor,
        isEmpty,
        suggestion,
        setSuggestion,
        activeSuggestionIndex,
        setActiveSuggestionIndex,
        activeHeading,
        activeInlineState,
        adminResults,
        userResults,
        usersLoading,
        insertAdminMention,
        insertUserReference,
        executeCommand,
        handleEditorKeyDown,
        handleSuggestionKeyDown,
    } = useTicketDescriptionEditor({
        html,
        admins,
        onChange,
        searchUsers,
        containerRef,
    });

    const handleEditorClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        const userBadge = target.closest<HTMLElement>('[data-user-ref-id]');

        if (userBadge !== null) {
            event.preventDefault();
            const userId = Number.parseInt(userBadge.dataset.userRefId ?? '0', 10);

            if (userId > 0) {
                const route = adminUserShow(userId);
                router.visit(route.url);
            }

            return;
        }

        const adminBadge = target.closest<HTMLElement>(
            '[data-mention-admin-id]',
        );

        if (adminBadge === null) {
            return;
        }

        event.preventDefault();
        const adminId = Number.parseInt(
            adminBadge.dataset.mentionAdminId ?? '0',
            10,
        );

        if (adminId > 0) {
            const route = adminUserShow(adminId);
            router.visit(route.url);
        }
    }, []);

    return (
        <div className={cn('flex min-h-0 flex-col space-y-1.5', className)}>
            <label className="text-sm font-medium text-zinc-200">{label}</label>

            <div
                ref={containerRef}
                className="relative flex h-full min-h-[13.75rem] flex-1 flex-col overflow-visible rounded-lg border border-border bg-background"
            >
                <TicketDescriptionToolbar
                    editor={editor}
                    activeHeading={activeHeading}
                    activeInlineState={activeInlineState}
                    executeCommand={executeCommand}
                />

                <div className="relative flex min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    <EditorContent
                        editor={editor}
                        className="min-h-full w-full"
                        onKeyDownCapture={handleEditorKeyDown}
                        onClick={handleEditorClick}
                    />

                    {isEmpty ? (
                        <p className="pointer-events-none absolute top-2 left-3 text-sm text-zinc-600">
                            {placeholder}
                        </p>
                    ) : null}
                </div>

                <TicketSuggestionPopover
                    suggestion={suggestion}
                    adminResults={adminResults}
                    userResults={userResults}
                    usersLoading={usersLoading}
                    activeSuggestionIndex={activeSuggestionIndex}
                    onActiveSuggestionIndexChange={setActiveSuggestionIndex}
                    onSuggestionOpenChange={(open) => {
                        if (!open) {
                            setSuggestion(null);
                        }
                    }}
                    onSuggestionKeyDown={handleSuggestionKeyDown}
                    insertAdminMention={insertAdminMention}
                    insertUserReference={insertUserReference}
                />
            </div>
        </div>
    );
}
