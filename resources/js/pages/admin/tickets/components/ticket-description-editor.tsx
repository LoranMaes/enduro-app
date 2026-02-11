import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { router } from '@inertiajs/react';
import {
    AtSign,
    Bold,
    Italic,
    List,
    LoaderCircle,
    UserRound,
    Underline as UnderlineIcon,
} from 'lucide-react';
import {
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { show as adminUserShow } from '@/routes/admin/users';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    AdminMentionNode,
    UserReferenceNode,
} from './editor/token-extensions';

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

type HeadingOption = 'p' | 'h1' | 'h2' | 'h3';

type SuggestionState = {
    mode: 'admin' | 'user';
    query: string;
    from: number;
    to: number;
    left: number;
    top: number;
};

type TicketDescriptionEditorProps = {
    label: string;
    html: string;
    placeholder: string;
    admins: MentionableAdmin[];
    className?: string;
    onChange: (value: TicketDescriptionValue) => void;
    searchUsers: (query: string) => Promise<MentionableUser[]>;
};

const SUGGESTION_MENU_WIDTH = 288;

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
    const searchUsersRef = useRef(searchUsers);
    const latestUserSearchRequestId = useRef(0);

    useEffect(() => {
        searchUsersRef.current = searchUsers;
    }, [searchUsers]);

    const syncToolbarState = useCallback((editor: Editor): void => {
        if (editor.isActive('heading', { level: 1 })) {
            setActiveHeading('h1');
        } else if (editor.isActive('heading', { level: 2 })) {
            setActiveHeading('h2');
        } else if (editor.isActive('heading', { level: 3 })) {
            setActiveHeading('h3');
        } else {
            setActiveHeading('p');
        }

        setActiveInlineState({
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            bulletList: editor.isActive('bulletList'),
        });
    }, []);

    const resolveSuggestion = useCallback((editor: Editor): void => {
        const detected = detectSuggestionAtCaret(editor);

        if (detected === null || containerRef.current === null) {
            setSuggestion(null);
            return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const maxLeft = Math.max(8, containerRect.width - SUGGESTION_MENU_WIDTH - 8);

        setSuggestion({
            ...detected,
            left: Math.min(Math.max(8, detected.left - containerRect.left), maxLeft),
            top: Math.max(56, detected.top - containerRect.top + 4),
        });
    }, []);

    const emitValue = useCallback(
        (editor: Editor): void => {
            const mentionAdminIds: number[] = [];
            const userRefs: DescriptionUserRef[] = [];

            editor.state.doc.descendants((node) => {
                if (node.type.name === 'adminMention') {
                    const id = Number.parseInt(String(node.attrs.id ?? '0'), 10);

                    if (id > 0) {
                        mentionAdminIds.push(id);
                    }
                }

                if (node.type.name === 'userReference') {
                    const id = Number.parseInt(String(node.attrs.id ?? '0'), 10);

                    if (id > 0) {
                        userRefs.push({
                            id,
                            name: String(node.attrs.name ?? ''),
                            email: String(node.attrs.email ?? ''),
                            role: String(node.attrs.role ?? ''),
                        });
                    }
                }
            });

            const text = editor.getText();

            setIsEmpty(text.trim().length === 0);

            onChange({
                html: editor.getHTML(),
                text,
                mentionAdminIds: Array.from(new Set(mentionAdminIds)),
                userRefs,
            });
        },
        [onChange],
    );

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            AdminMentionNode,
            UserReferenceNode,
        ],
        content: html,
        autofocus: false,
        editorProps: {
            attributes: {
                class: 'min-h-full w-full break-words whitespace-pre-wrap text-sm leading-6 text-zinc-200 outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:w-full [&_.ProseMirror_h1]:mb-1 [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:mb-1 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:my-1 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:my-1 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5',
            },
        },
        onCreate: ({ editor: createdEditor }) => {
            syncToolbarState(createdEditor);
            resolveSuggestion(createdEditor);
            emitValue(createdEditor);
        },
        onSelectionUpdate: ({ editor: activeEditor }) => {
            syncToolbarState(activeEditor);
            resolveSuggestion(activeEditor);
        },
        onUpdate: ({ editor: activeEditor }) => {
            if (consumeSlashCommand(activeEditor)) {
                return;
            }

            emitValue(activeEditor);
            syncToolbarState(activeEditor);
            resolveSuggestion(activeEditor);
        },
    });

    useEffect(() => {
        if (editor === null) {
            return;
        }

        if (editor.getHTML() === html) {
            return;
        }

        editor.commands.setContent(html, { emitUpdate: false });
        syncToolbarState(editor);
        resolveSuggestion(editor);
        emitValue(editor);
    }, [editor, emitValue, html, resolveSuggestion, syncToolbarState]);

    useEffect(() => {
        setActiveSuggestionIndex(0);
    }, [suggestion?.mode, suggestion?.query]);

    const adminResults = useMemo(() => {
        if (suggestion?.mode !== 'admin') {
            return [];
        }

        const query = suggestion.query.trim().toLowerCase();

        if (query.length === 0) {
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
        const mode = suggestion?.mode;
        const query = suggestion?.query.trim() ?? '';

        if (mode !== 'user' || query.length < 1 || query.length > 120) {
            latestUserSearchRequestId.current += 1;
            setUsersLoading(false);
            setUserResults([]);
            return;
        }

        const requestId = latestUserSearchRequestId.current + 1;
        latestUserSearchRequestId.current = requestId;
        setUsersLoading(true);

        const timeoutId = window.setTimeout(() => {
            void searchUsersRef
                .current(query)
                .then((results) => {
                    if (latestUserSearchRequestId.current !== requestId) {
                        return;
                    }

                    setUserResults(results.slice(0, 6));
                })
                .catch(() => {
                    if (latestUserSearchRequestId.current !== requestId) {
                        return;
                    }

                    setUserResults([]);
                })
                .finally(() => {
                    if (latestUserSearchRequestId.current !== requestId) {
                        return;
                    }

                    setUsersLoading(false);
                });
        }, 180);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [suggestion?.mode, suggestion?.query]);

    const currentSuggestionCount =
        suggestion === null
            ? 0
            : suggestion.mode === 'admin'
              ? adminResults.length
              : userResults.length;

    useEffect(() => {
        setActiveSuggestionIndex((current) => {
            if (currentSuggestionCount <= 0) {
                return 0;
            }

            return Math.min(current, currentSuggestionCount - 1);
        });
    }, [currentSuggestionCount]);

    const insertAdminMention = useCallback(
        (admin: MentionableAdmin): void => {
            if (editor === null || suggestion?.mode !== 'admin') {
                return;
            }

            editor
                .chain()
                .focus()
                .deleteRange({ from: suggestion.from, to: suggestion.to })
                .insertContent([
                    {
                        type: 'adminMention',
                        attrs: {
                            id: admin.id,
                            name: admin.name,
                            email: admin.email,
                        },
                    },
                    { type: 'text', text: ' ' },
                ])
                .run();

            setSuggestion(null);
            setUserResults([]);
            setUsersLoading(false);
            editor.commands.focus();
        },
        [editor, suggestion],
    );

    const insertUserReference = useCallback(
        (user: MentionableUser): void => {
            if (editor === null || suggestion?.mode !== 'user') {
                return;
            }

            editor
                .chain()
                .focus()
                .deleteRange({ from: suggestion.from, to: suggestion.to })
                .insertContent([
                    {
                        type: 'userReference',
                        attrs: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        },
                    },
                    { type: 'text', text: ' ' },
                ])
                .run();

            setSuggestion(null);
            setUserResults([]);
            setUsersLoading(false);
            editor.commands.focus();
        },
        [editor, suggestion],
    );

    const insertSuggestionByIndex = useCallback(
        (index: number): void => {
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
        },
        [adminResults, insertAdminMention, insertUserReference, suggestion, userResults],
    );

    const executeCommand = (command: () => void): void => {
        if (editor === null) {
            return;
        }

        command();
        editor.commands.focus();
        syncToolbarState(editor);
        resolveSuggestion(editor);
    };

    const handleSuggestionKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>): boolean => {
            if (editor === null || suggestion === null) {
                return false;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                setSuggestion(null);
                setUsersLoading(false);
                setUserResults([]);
                editor.commands.focus();
                return true;
            }

            if (currentSuggestionCount <= 0) {
                return false;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveSuggestionIndex((current) => {
                    return (current + 1) % currentSuggestionCount;
                });
                return true;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveSuggestionIndex((current) => {
                    return (
                        (current - 1 + currentSuggestionCount) %
                        currentSuggestionCount
                    );
                });
                return true;
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
                return true;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                insertSuggestionByIndex(activeSuggestionIndex);
                return true;
            }

            return false;
        },
        [
            activeSuggestionIndex,
            currentSuggestionCount,
            editor,
            insertSuggestionByIndex,
            suggestion,
        ],
    );

    const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (editor === null) {
            return;
        }

        if (handleSuggestionKeyDown(event)) {
            return;
        }

        if (suggestion !== null) {
            return;
        }

        if (event.key === 'Escape') {
            setSuggestion(null);
            setUsersLoading(false);
            setUserResults([]);
        }
    };

    const handleEditorClick = (event: MouseEvent<HTMLDivElement>): void => {
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

        const adminBadge = target.closest<HTMLElement>('[data-mention-admin-id]');

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
    };

    return (
        <div className={cn('flex min-h-0 flex-col space-y-1.5', className)}>
            <label className="text-sm font-medium text-zinc-200">{label}</label>

            <div
                ref={containerRef}
                className="relative flex h-full min-h-[13.75rem] flex-1 flex-col overflow-visible rounded-lg border border-border bg-background"
            >
                <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
                    <ToolbarButton
                        label="Bold"
                        icon={<Bold className="size-3.5" />}
                        isActive={activeInlineState.bold}
                        onClick={() => {
                            executeCommand(() => {
                                editor?.chain().focus().toggleBold().run();
                            });
                        }}
                    />
                    <ToolbarButton
                        label="Italic"
                        icon={<Italic className="size-3.5" />}
                        isActive={activeInlineState.italic}
                        onClick={() => {
                            executeCommand(() => {
                                editor?.chain().focus().toggleItalic().run();
                            });
                        }}
                    />
                    <ToolbarButton
                        label="Underline"
                        icon={<UnderlineIcon className="size-3.5" />}
                        isActive={activeInlineState.underline}
                        onClick={() => {
                            executeCommand(() => {
                                editor?.chain().focus().toggleUnderline().run();
                            });
                        }}
                    />
                    <ToolbarButton
                        label="Bullet list"
                        icon={<List className="size-3.5" />}
                        isActive={activeInlineState.bulletList}
                        onClick={() => {
                            executeCommand(() => {
                                editor?.chain().focus().toggleBulletList().run();
                            });
                        }}
                    />

                    <Select
                        value={activeHeading}
                        onValueChange={(value) => {
                            executeCommand(() => {
                                if (editor === null) {
                                    return;
                                }

                                if (value === 'p') {
                                    editor.chain().focus().setParagraph().run();
                                    return;
                                }

                                const level = Number.parseInt(value.replace('h', ''), 10) as
                                    | 1
                                    | 2
                                    | 3;

                                editor.chain().focus().toggleHeading({ level }).run();
                            });
                        }}
                    >
                        <SelectTrigger className="h-7 w-[8.625rem] border-zinc-800 bg-zinc-900/70 px-2 text-xs text-zinc-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                            <SelectItem value="p">Paragraph</SelectItem>
                            <SelectItem value="h1">Heading 1</SelectItem>
                            <SelectItem value="h2">Heading 2</SelectItem>
                            <SelectItem value="h3">Heading 3</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="ml-auto inline-flex items-center gap-2 text-[0.6875rem] text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                            <AtSign className="size-3" /> Mention admin
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <UserRound className="size-3" /> /user athlete|coach
                        </span>
                    </div>
                </div>

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

                <Popover
                    open={suggestion !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSuggestion(null);
                        }
                    }}
                    modal={false}
                >
                    <PopoverAnchor asChild>
                        <span
                            aria-hidden
                            className="pointer-events-none absolute z-30 h-0.5 w-0.5"
                            style={{
                                left: `${suggestion?.left ?? 0}px`,
                                top: `${suggestion?.top ?? 0}px`,
                            }}
                        />
                    </PopoverAnchor>
                    <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="w-72 border-border bg-surface p-1"
                        onOpenAutoFocus={(event) => {
                            event.preventDefault();
                        }}
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <Command
                            className="bg-transparent"
                            onKeyDown={(event) => {
                                handleSuggestionKeyDown(event);
                            }}
                        >
                            <CommandList>
                                {suggestion?.mode === 'admin' ? (
                                    adminResults.length === 0 ? (
                                        <CommandEmpty>No admins found.</CommandEmpty>
                                    ) : (
                                        <CommandGroup heading="Admins">
                                            {adminResults.map((admin, index) => (
                                                <CommandItem
                                                    key={admin.id}
                                                    value={`${admin.name} ${admin.email}`}
                                                    className={cn(
                                                        index === activeSuggestionIndex
                                                            ? 'bg-zinc-800 text-zinc-100'
                                                            : undefined,
                                                    )}
                                                    onMouseEnter={() => {
                                                        setActiveSuggestionIndex(index);
                                                    }}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        insertAdminMention(admin);
                                                    }}
                                                >
                                                    <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                                        <AvatarFallback className="bg-zinc-900 text-[0.625rem] text-zinc-300">
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
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )
                                ) : usersLoading ? (
                                    <div className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-500">
                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                        Searching users...
                                    </div>
                                ) : userResults.length === 0 ? (
                                    <CommandEmpty>No users found.</CommandEmpty>
                                ) : (
                                    <CommandGroup heading="Users">
                                        {userResults.map((user, index) => (
                                            <CommandItem
                                                key={user.id}
                                                value={`${user.name} ${user.email}`}
                                                className={cn(
                                                    index === activeSuggestionIndex
                                                        ? 'bg-zinc-800 text-zinc-100'
                                                        : undefined,
                                                )}
                                                onMouseEnter={() => {
                                                    setActiveSuggestionIndex(index);
                                                }}
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    insertUserReference(user);
                                                }}
                                            >
                                                <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                                    <AvatarFallback className="bg-zinc-900 text-[0.625rem] text-zinc-300">
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
                                                <span className="rounded border border-zinc-700 px-1 py-0 text-[0.625rem] text-zinc-500 capitalize">
                                                    {user.role}
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
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

function detectSuggestionAtCaret(editor: Editor): SuggestionState | null {
    const selection = editor.state.selection;

    if (!selection.empty) {
        return null;
    }

    const from = selection.from;
    const beforeText = editor.state.doc.textBetween(
        Math.max(0, from - 220),
        from,
        '\n',
        '\u0000',
    );

    const adminMatch = /(?:^|[^\p{L}\p{N}_])(@([\w.-]{0,120}))$/u.exec(
        beforeText,
    );

    if (adminMatch !== null) {
        const token = adminMatch[1] ?? '';
        const query = adminMatch[2] ?? '';
        const start = from - token.length;

        if (start >= 0) {
            const cursorPosition = editor.view.coordsAtPos(from);

            return {
                mode: 'admin',
                query,
                from: start,
                to: from,
                left: cursorPosition.left,
                top: cursorPosition.bottom,
            };
        }
    }

    const userMatch =
        /(?:^|[^\p{L}\p{N}_])(\/user(?:\s+([^\n\r]{0,120})?)?)$/iu.exec(
            beforeText,
        );

    if (userMatch === null) {
        return null;
    }

    const token = userMatch[1] ?? '';
    const start = from - token.length;

    if (start < 0) {
        return null;
    }

    const cursorPosition = editor.view.coordsAtPos(from);

    return {
        mode: 'user',
        query: (userMatch[2] ?? '').trimStart(),
        from: start,
        to: from,
        left: cursorPosition.left,
        top: cursorPosition.bottom,
    };
}

function consumeSlashCommand(editor: Editor): boolean {
    const selection = editor.state.selection;

    if (!selection.empty) {
        return false;
    }

    const from = selection.from;
    const beforeText = editor.state.doc.textBetween(
        Math.max(0, from - 48),
        from,
        '\n',
        '\u0000',
    );
    const match = beforeText.match(
        /(?:^|\s)\/(h1|h2|h3|paragraph|p|bullet|list|ul|bold|italic|underline)\s$/i,
    );

    if (match === null) {
        return false;
    }

    const token = (match[0] ?? '').trimStart();
    const rangeFrom = from - token.length;

    if (rangeFrom < 0) {
        return false;
    }

    editor.chain().focus().deleteRange({ from: rangeFrom, to: from }).run();

    const command = (match[1] ?? '').toLowerCase();

    if (command === 'h1') {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        return true;
    }

    if (command === 'h2') {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        return true;
    }

    if (command === 'h3') {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        return true;
    }

    if (command === 'paragraph' || command === 'p') {
        editor.chain().focus().setParagraph().run();
        return true;
    }

    if (command === 'bullet' || command === 'list' || command === 'ul') {
        editor.chain().focus().toggleBulletList().run();
        return true;
    }

    if (command === 'bold') {
        editor.chain().focus().toggleBold().run();
        return true;
    }

    if (command === 'italic') {
        editor.chain().focus().toggleItalic().run();
        return true;
    }

    if (command === 'underline') {
        editor.chain().focus().toggleUnderline().run();
        return true;
    }

    return false;
}

function initials(value: string): string {
    return value
        .split(' ')
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}
