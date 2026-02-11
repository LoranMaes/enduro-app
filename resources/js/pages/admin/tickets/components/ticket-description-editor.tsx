import { router } from '@inertiajs/react';
import {
    AtSign,
    Bold,
    Italic,
    List,
    LoaderCircle,
    Underline,
    UserRound,
} from 'lucide-react';
import {
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type MentionableAdmin = {
    id: number;
    name: string;
    email: string;
};

export type MentionableUser = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export type DescriptionUserRef = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export type TicketDescriptionValue = {
    html: string;
    text: string;
    mentionAdminIds: number[];
    userRefs: DescriptionUserRef[];
};

type SuggestionState = {
    mode: 'admin' | 'user';
    query: string;
    left: number;
    top: number;
};

type HeadingOption = 'p' | 'h1' | 'h2' | 'h3';

type TicketDescriptionEditorProps = {
    label: string;
    html: string;
    placeholder: string;
    admins: MentionableAdmin[];
    className?: string;
    onChange: (value: TicketDescriptionValue) => void;
    searchUsers: (query: string) => Promise<MentionableUser[]>;
};

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
    const editorRef = useRef<HTMLDivElement | null>(null);
    const caretRangeRef = useRef<Range | null>(null);

    const [isEmpty, setIsEmpty] = useState(true);
    const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [userResults, setUserResults] = useState<MentionableUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [activeHeading, setActiveHeading] = useState<HeadingOption>('p');
    const [activeInlineState, setActiveInlineState] = useState({
        bold: false,
        italic: false,
        underline: false,
        bulletList: false,
    });

    useEffect(() => {
        if (editorRef.current === null) {
            return;
        }

        if (editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }

        const textContent = editorRef.current.textContent?.trim() ?? '';
        setIsEmpty(textContent === '');
        syncToolbarState();
    }, [html]);

    const adminResults = useMemo(() => {
        if (suggestion?.mode !== 'admin') {
            return [];
        }

        const query = suggestion.query.trim().toLowerCase();

        if (query === '') {
            return admins.slice(0, 6);
        }

        return admins
            .filter((admin) => {
                return (
                    admin.name.toLowerCase().includes(query) ||
                    admin.email.toLowerCase().includes(query)
                );
            })
            .slice(0, 6);
    }, [admins, suggestion]);

    useEffect(() => {
        const suggestionMode = suggestion?.mode;
        const suggestionQuery = suggestion?.query.trim() ?? '';

        if (
            suggestionMode !== 'user' ||
            suggestionQuery.length < 2 ||
            suggestionQuery.length > 120
        ) {
            setUserResults([]);
            setUsersLoading(false);

            return;
        }

        setUsersLoading(true);

        const timeoutId = window.setTimeout(() => {
            void searchUsers(suggestionQuery)
                .then((results) => {
                    setUserResults(results.slice(0, 6));
                })
                .catch(() => {
                    setUserResults([]);
                })
                .finally(() => {
                    setUsersLoading(false);
                });
        }, 220);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchUsers, suggestion?.mode, suggestion?.query]);

    const updateValue = (): void => {
        if (editorRef.current === null) {
            return;
        }

        const root = editorRef.current;
        const nextHtml = root.innerHTML;
        const nextText = root.innerText;
        const mentionAdminIds = Array.from(
            root.querySelectorAll<HTMLElement>('[data-mention-admin-id]'),
        )
            .map((element) =>
                Number.parseInt(element.dataset.mentionAdminId ?? '0', 10),
            )
            .filter((id) => id > 0);

        const userRefs = Array.from(
            root.querySelectorAll<HTMLElement>('[data-user-ref-id]'),
        )
            .map((element) => {
                const id = Number.parseInt(
                    element.dataset.userRefId ?? '0',
                    10,
                );

                if (id <= 0) {
                    return null;
                }

                return {
                    id,
                    name: element.dataset.userRefName ?? '',
                    email: element.dataset.userRefEmail ?? '',
                    role: element.dataset.userRefRole ?? '',
                } satisfies DescriptionUserRef;
            })
            .filter((ref): ref is DescriptionUserRef => ref !== null);

        setIsEmpty(nextText.trim() === '');

        onChange({
            html: nextHtml,
            text: nextText,
            mentionAdminIds: Array.from(new Set(mentionAdminIds)),
            userRefs,
        });
    };

    const resolveSuggestion = (): void => {
        if (editorRef.current === null) {
            return;
        }

        const selection = window.getSelection();

        if (selection !== null && selection.rangeCount > 0) {
            const currentRange = selection.getRangeAt(0);

            if (editorRef.current.contains(currentRange.startContainer)) {
                caretRangeRef.current = currentRange.cloneRange();
            }
        }

        const detectedSuggestion = detectSuggestionAtCaret(editorRef.current);
        setSuggestion(detectedSuggestion);
    };

    useEffect(() => {
        setActiveSuggestionIndex(0);
    }, [suggestion?.mode, suggestion?.query]);

    const currentSuggestionCount = useMemo(() => {
        if (suggestion === null) {
            return 0;
        }

        return suggestion.mode === 'admin'
            ? adminResults.length
            : userResults.length;
    }, [adminResults.length, suggestion, userResults.length]);

    useEffect(() => {
        setActiveSuggestionIndex((current) => {
            if (currentSuggestionCount === 0) {
                return 0;
            }

            return Math.min(current, currentSuggestionCount - 1);
        });
    }, [currentSuggestionCount]);

    const insertSuggestionByIndex = (index: number): void => {
        if (suggestion === null) {
            return;
        }

        if (suggestion.mode === 'admin') {
            const admin = adminResults[index];

            if (admin !== undefined) {
                insertAdminMention(admin);
            }

            return;
        }

        const user = userResults[index];

        if (user !== undefined) {
            insertUserReference(user);
        }
    };

    const syncToolbarState = (): void => {
        if (editorRef.current === null) {
            return;
        }

        const selection = window.getSelection();

        if (
            selection === null ||
            selection.rangeCount === 0 ||
            !editorRef.current.contains(selection.anchorNode)
        ) {
            setActiveHeading('p');
            setActiveInlineState({
                bold: false,
                italic: false,
                underline: false,
                bulletList: false,
            });

            return;
        }

        const headingValue = normalizeHeadingValue(
            String(document.queryCommandValue('formatBlock') ?? ''),
        );

        setActiveHeading(headingValue);
        setActiveInlineState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            bulletList: document.queryCommandState('insertUnorderedList'),
        });
    };

    const executeCommand = (command: string, value?: string): void => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        updateValue();
        resolveSuggestion();
        syncToolbarState();
    };

    const consumeSlashCommand = (): boolean => {
        if (editorRef.current === null) {
            return false;
        }

        const selection = window.getSelection();

        if (selection === null || selection.rangeCount === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);

        if (
            !range.collapsed ||
            !editorRef.current.contains(range.startContainer) ||
            range.startContainer.nodeType !== Node.TEXT_NODE
        ) {
            return false;
        }

        const textNode = range.startContainer as Text;
        const beforeCaret = textNode.data.slice(0, range.startOffset);
        const commandMatch = beforeCaret.match(
            /(?:^|\s)\/(h1|h2|h3|paragraph|p|bullet|list|ul|bold|italic|underline)\s$/i,
        );

        if (commandMatch === null) {
            return false;
        }

        const rawCommand = commandMatch[0] ?? '';
        const commandToken = rawCommand.startsWith(' ')
            ? rawCommand.slice(1)
            : rawCommand;
        const removeStart = Math.max(
            0,
            range.startOffset - commandToken.length,
        );

        textNode.deleteData(removeStart, range.startOffset - removeStart);
        range.setStart(textNode, removeStart);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        const normalizedCommand = (commandMatch[1] ?? '').toLowerCase();

        if (normalizedCommand === 'h1') {
            executeCommand('formatBlock', 'h1');
            return true;
        }

        if (normalizedCommand === 'h2') {
            executeCommand('formatBlock', 'h2');
            return true;
        }

        if (normalizedCommand === 'h3') {
            executeCommand('formatBlock', 'h3');
            return true;
        }

        if (normalizedCommand === 'paragraph' || normalizedCommand === 'p') {
            executeCommand('formatBlock', 'p');
            return true;
        }

        if (
            normalizedCommand === 'bullet' ||
            normalizedCommand === 'list' ||
            normalizedCommand === 'ul'
        ) {
            executeCommand('insertUnorderedList');
            return true;
        }

        if (normalizedCommand === 'bold') {
            executeCommand('bold');
            return true;
        }

        if (normalizedCommand === 'italic') {
            executeCommand('italic');
            return true;
        }

        if (normalizedCommand === 'underline') {
            executeCommand('underline');
            return true;
        }

        return false;
    };

    const handleEditorInput = (): void => {
        if (consumeSlashCommand()) {
            return;
        }

        updateValue();
        resolveSuggestion();
        syncToolbarState();
    };

    const handleEditorKeyUp = (): void => {
        resolveSuggestion();
        syncToolbarState();
    };

    const handleEditorKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
    ): void => {
        if (suggestion === null) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setSuggestion(null);
            setUserResults([]);
            setUsersLoading(false);
            return;
        }

        if (currentSuggestionCount === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestionIndex((current) => {
                return (current + 1) % currentSuggestionCount;
            });
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestionIndex((current) => {
                return (
                    (current - 1 + currentSuggestionCount) %
                    currentSuggestionCount
                );
            });
            return;
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            setActiveSuggestionIndex((current) => {
                if (event.shiftKey) {
                    return (
                        (current - 1 + currentSuggestionCount) %
                        currentSuggestionCount
                    );
                }

                return (current + 1) % currentSuggestionCount;
            });
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            insertSuggestionByIndex(activeSuggestionIndex);
        }
    };

    const insertAdminMention = (admin: MentionableAdmin): void => {
        insertReferenceBadge({
            kind: 'admin',
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
        });
    };

    const insertUserReference = (user: MentionableUser): void => {
        insertReferenceBadge({
            kind: 'user',
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    };

    const insertReferenceBadge = (payload: {
        kind: 'admin' | 'user';
        id: number;
        name: string;
        email: string;
        role: string;
    }): void => {
        if (editorRef.current === null) {
            return;
        }

        const selection = window.getSelection();
        let range: Range | null = null;

        if (selection !== null && selection.rangeCount > 0) {
            const currentRange = selection.getRangeAt(0);

            if (editorRef.current.contains(currentRange.startContainer)) {
                range = currentRange;
            }
        }

        if (range === null && caretRangeRef.current !== null) {
            const fallbackRange = caretRangeRef.current.cloneRange();

            if (editorRef.current.contains(fallbackRange.startContainer)) {
                range = fallbackRange;

                if (selection !== null) {
                    selection.removeAllRanges();
                    selection.addRange(fallbackRange);
                }
            }
        }

        if (range === null || !editorRef.current.contains(range.startContainer)) {
            return;
        }

        if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const textNode = range.startContainer as Text;
            const before = textNode.data.slice(0, range.startOffset);
            const matchRegex =
                payload.kind === 'admin'
                    ? /@[\w.-]*$/
                    : /\/user\s+[^\n]*$/i;
            const match = before.match(matchRegex);

            if (match !== null) {
                const matchedToken = match[0];
                const removeStart = Math.max(
                    0,
                    range.startOffset - matchedToken.length,
                );

                textNode.deleteData(
                    removeStart,
                    range.startOffset - removeStart,
                );
                range.setStart(textNode, removeStart);
                range.collapse(true);
            }
        }

        const badge = document.createElement('button');
        badge.type = 'button';
        badge.setAttribute('contenteditable', 'false');
        badge.className =
            'mx-0.5 inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/90 px-1.5 py-0.5 text-[11px] font-medium text-zinc-200 hover:border-zinc-500';

        if (payload.kind === 'admin') {
            badge.dataset.mentionAdminId = String(payload.id);
            badge.textContent = `@${payload.name}`;
        } else {
            badge.dataset.userRefId = String(payload.id);
            badge.dataset.userRefName = payload.name;
            badge.dataset.userRefEmail = payload.email;
            badge.dataset.userRefRole = payload.role;
            badge.textContent = `${payload.name} [${payload.email}]`;
        }

        range.insertNode(badge);

        const spacer = document.createTextNode(' ');
        badge.after(spacer);

        const nextRange = document.createRange();
        nextRange.setStartAfter(spacer);
        nextRange.collapse(true);
        if (selection !== null) {
            selection.removeAllRanges();
            selection.addRange(nextRange);
        }
        caretRangeRef.current = nextRange.cloneRange();

        setSuggestion(null);
        setUserResults([]);
        setUsersLoading(false);
        updateValue();
        syncToolbarState();
    };

    const openUserFromBadge = (event: MouseEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        const userBadge = target.closest<HTMLElement>('[data-user-ref-id]');

        if (userBadge !== null) {
            event.preventDefault();
            const userId = Number.parseInt(
                userBadge.dataset.userRefId ?? '0',
                10,
            );

            if (userId > 0) {
                router.visit(`/admin/users/${userId}`);
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
            router.visit(`/admin/users/${adminId}`);
        }
    };

    const suggestionMenuPosition = useMemo(() => {
        if (suggestion === null || containerRef.current === null) {
            return {
                className: '',
                left: 8,
                top: 56,
            };
        }

        const menuWidth = 288;
        const estimatedMenuHeight = 220;
        const containerRect = containerRef.current.getBoundingClientRect();
        const maxLeft = Math.max(8, containerRect.width - menuWidth - 8);
        const left = Math.min(
            Math.max(8, suggestion.left - containerRect.left),
            maxLeft,
        );
        const topBelow = suggestion.top - containerRect.top + 22;
        const canRenderBelow =
            topBelow + estimatedMenuHeight <= containerRect.height - 8;

        if (canRenderBelow) {
            return {
                className: '',
                left,
                top: Math.max(56, topBelow),
            };
        }

        return {
            className: '-translate-y-full',
            left,
            top: Math.max(56, suggestion.top - containerRect.top - 8),
        };
    }, [suggestion]);

    return (
        <div className={cn('flex min-h-0 flex-col space-y-1.5', className)}>
            <label className="text-sm font-medium text-zinc-200">{label}</label>

            <div
                ref={containerRef}
                className="relative flex h-full min-h-[220px] flex-1 flex-col overflow-visible rounded-lg border border-border bg-background"
            >
                <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
                    <ToolbarButton
                        label="Bold"
                        icon={<Bold className="h-3.5 w-3.5" />}
                        isActive={activeInlineState.bold}
                        onClick={() => executeCommand('bold')}
                    />
                    <ToolbarButton
                        label="Italic"
                        icon={<Italic className="h-3.5 w-3.5" />}
                        isActive={activeInlineState.italic}
                        onClick={() => executeCommand('italic')}
                    />
                    <ToolbarButton
                        label="Underline"
                        icon={<Underline className="h-3.5 w-3.5" />}
                        isActive={activeInlineState.underline}
                        onClick={() => executeCommand('underline')}
                    />
                    <ToolbarButton
                        label="Bullet list"
                        icon={<List className="h-3.5 w-3.5" />}
                        isActive={activeInlineState.bulletList}
                        onClick={() => executeCommand('insertUnorderedList')}
                    />

                    <Select
                        value={activeHeading}
                        onValueChange={(value) => {
                            executeCommand('formatBlock', value);
                        }}
                    >
                        <SelectTrigger className="h-7 w-[138px] border-zinc-800 bg-zinc-900/70 px-2 text-xs text-zinc-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                            <SelectItem value="p">Paragraph</SelectItem>
                            <SelectItem value="h1">Heading 1</SelectItem>
                            <SelectItem value="h2">Heading 2</SelectItem>
                            <SelectItem value="h3">Heading 3</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="ml-auto inline-flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                            <AtSign className="h-3 w-3" /> Mention admin
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3 w-3" /> /user
                            athlete|coach
                        </span>
                    </div>
                </div>

                <div className="relative flex min-h-0 flex-1 overflow-y-auto px-3 py-2 text-sm leading-6 text-zinc-200">
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-full w-full break-words whitespace-pre-wrap outline-none [&_h1]:mb-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
                        onInput={handleEditorInput}
                        onKeyUp={handleEditorKeyUp}
                        onKeyDown={handleEditorKeyDown}
                        onMouseUp={syncToolbarState}
                        onFocus={syncToolbarState}
                        onClick={openUserFromBadge}
                    />

                    {isEmpty ? (
                        <p className="pointer-events-none absolute top-2 left-3 text-sm text-zinc-600">
                            {placeholder}
                        </p>
                    ) : null}
                </div>

                {suggestion !== null ? (
                    <div
                        className={cn(
                            'absolute z-[220] w-72 rounded-lg border border-border bg-surface p-1 shadow-xl',
                            suggestionMenuPosition.className,
                        )}
                        style={{
                            left: suggestionMenuPosition.left,
                            top: suggestionMenuPosition.top,
                        }}
                    >
                        {suggestion.mode === 'admin' ? (
                            adminResults.length === 0 ? (
                                <p className="px-2 py-2 text-xs text-zinc-500">
                                    No admins found.
                                </p>
                            ) : (
                                adminResults.map((admin, index) => (
                                    <button
                                        key={admin.id}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                                            index === activeSuggestionIndex
                                                ? 'bg-zinc-800 text-zinc-100'
                                                : 'text-zinc-200 hover:bg-zinc-800',
                                        )}
                                        onMouseEnter={() =>
                                            setActiveSuggestionIndex(index)
                                        }
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            insertAdminMention(admin);
                                        }}
                                    >
                                        <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                            <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-300">
                                                {initials(admin.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-zinc-100">
                                                {admin.name}
                                            </span>
                                            <span className="block truncate text-zinc-500">
                                                {admin.email}
                                            </span>
                                        </span>
                                    </button>
                                ))
                            )
                        ) : usersLoading ? (
                            <p className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-500">
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Searching users...
                            </p>
                        ) : userResults.length === 0 ? (
                            <p className="px-2 py-2 text-xs text-zinc-500">
                                No users found.
                            </p>
                        ) : (
                            userResults.map((user, index) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                                        index === activeSuggestionIndex
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-200 hover:bg-zinc-800',
                                    )}
                                    onMouseEnter={() =>
                                        setActiveSuggestionIndex(index)
                                    }
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        insertUserReference(user);
                                    }}
                                >
                                    <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                        <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-300">
                                            {initials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-zinc-100">
                                            {user.name}
                                        </span>
                                        <span className="block truncate text-zinc-500">
                                            {user.email}
                                        </span>
                                    </span>
                                    <span className="rounded border border-zinc-700 px-1 py-0 text-[10px] text-zinc-500 capitalize">
                                        {user.role}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ToolbarButton({
    label,
    icon,
    isActive,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                isActive
                    ? 'bg-zinc-700/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
            )}
            onMouseDown={(event) => {
                event.preventDefault();
                onClick();
            }}
            aria-label={label}
            aria-pressed={isActive}
        >
            {icon}
        </button>
    );
}

function detectSuggestionAtCaret(root: HTMLElement): SuggestionState | null {
    const selection = window.getSelection();

    if (selection === null || selection.rangeCount === 0) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const insideEditor = root.contains(range.startContainer);
    const isCollapsed = range.collapsed;

    if (!isCollapsed || !insideEditor) {
        return null;
    }

    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(root);
    beforeRange.setEnd(range.endContainer, range.endOffset);

    const textBeforeCaret = beforeRange.toString();
    const coords = resolveCaretCoordinates(range, root);
    const textBeforeCaretInNode =
        range.startContainer.nodeType === Node.TEXT_NODE
            ? (range.startContainer as Text).data.slice(0, range.startOffset)
            : '';
    const safeTail = (textBeforeCaretInNode || textBeforeCaret).slice(-200);

    const adminMatch = safeTail.match(/(?:^|[\s\u00a0])@([\w.-]{0,120})$/);

    if (adminMatch !== null) {
        return {
            mode: 'admin',
            query: adminMatch[1] ?? '',
            ...coords,
        };
    }

    const userMatch = safeTail.match(
        /(?:^|[\s\u00a0])\/user(?:\s+([^\n\r]{0,120})?)?$/i,
    );

    if (userMatch === null) {
        return null;
    }

    return {
        mode: 'user',
        query: (userMatch[1] ?? '').trim(),
        ...coords,
    };
}

function resolveCaretCoordinates(
    range: Range,
    container: HTMLElement,
): {
    left: number;
    top: number;
} {
    const rangeRect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = rangeRect.left === 0 ? containerRect.left + 8 : rangeRect.left;
    const top = rangeRect.top === 0 ? containerRect.top + 32 : rangeRect.top;

    return {
        left: Math.max(8, left),
        top: Math.max(40, top),
    };
}

function normalizeHeadingValue(value: string): HeadingOption {
    const normalized = value.toLowerCase().replace(/[<>]/g, '');

    if (normalized === 'h1') {
        return 'h1';
    }

    if (normalized === 'h2') {
        return 'h2';
    }

    if (normalized === 'h3') {
        return 'h3';
    }

    return 'p';
}

function initials(value: string): string {
    return value
        .split(' ')
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}
