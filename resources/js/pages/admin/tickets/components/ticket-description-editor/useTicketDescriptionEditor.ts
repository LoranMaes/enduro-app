import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    type KeyboardEvent,
    type RefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    AdminMentionNode,
    UserReferenceNode,
} from '../editor/token-extensions';
import type {
    HeadingOption,
    MentionableAdmin,
    MentionableUser,
    SuggestionState,
    TicketDescriptionValue,
} from './types';
import {
    consumeSlashCommand,
    detectSuggestionAtCaret,
    getRootFontSize,
} from './utils';

const SUGGESTION_MENU_WIDTH_REM = 18;

type UseTicketDescriptionEditorOptions = {
    html: string;
    admins: MentionableAdmin[];
    onChange: (value: TicketDescriptionValue) => void;
    searchUsers: (query: string) => Promise<MentionableUser[]>;
    containerRef: RefObject<HTMLDivElement | null>;
};

type UseTicketDescriptionEditorResult = {
    editor: Editor | null;
    isEmpty: boolean;
    suggestion: SuggestionState | null;
    setSuggestion: (value: SuggestionState | null) => void;
    activeSuggestionIndex: number;
    setActiveSuggestionIndex: (value: number) => void;
    activeHeading: HeadingOption;
    activeInlineState: {
        bold: boolean;
        italic: boolean;
        underline: boolean;
        bulletList: boolean;
    };
    adminResults: MentionableAdmin[];
    userResults: MentionableUser[];
    usersLoading: boolean;
    insertAdminMention: (admin: MentionableAdmin) => void;
    insertUserReference: (user: MentionableUser) => void;
    executeCommand: (command: () => void) => void;
    handleEditorKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    handleSuggestionKeyDown: (event: KeyboardEvent<HTMLElement>) => boolean;
};

export function useTicketDescriptionEditor({
    html,
    admins,
    onChange,
    searchUsers,
    containerRef,
}: UseTicketDescriptionEditorOptions): UseTicketDescriptionEditorResult {
    const [isEmpty, setIsEmpty] = useState(true);
    const [suggestion, setSuggestion] = useState<SuggestionState | null>(null);
    const [rawActiveSuggestionIndex, setRawActiveSuggestionIndex] = useState(0);
    const [userResults, setUserResults] = useState<MentionableUser[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [activeHeading, setActiveHeading] = useState<HeadingOption>('p');
    const [activeInlineState, setActiveInlineState] = useState({
        bold: false,
        italic: false,
        underline: false,
        bulletList: false,
    });
    const searchUsersRef = useRef(searchUsers);
    const latestUserSearchRequestId = useRef(0);
    const lastSuggestionRef = useRef<string | null>(null);

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

    const resolveSuggestion = useCallback(
        (editor: Editor): void => {
            const detected = detectSuggestionAtCaret(editor);

            if (detected === null || containerRef.current === null) {
                lastSuggestionRef.current = null;
                setSuggestion(null);
                return;
            }

            const containerRect = containerRef.current.getBoundingClientRect();
            const rootFontSize = getRootFontSize();
            const menuWidth = SUGGESTION_MENU_WIDTH_REM * rootFontSize;
            const maxLeft = Math.max(8, containerRect.width - menuWidth - 8);

            const nextSuggestion: SuggestionState = {
                ...detected,
                left: Math.min(
                    Math.max(8, detected.left - containerRect.left),
                    maxLeft,
                ),
                top: Math.max(56, detected.top - containerRect.top + 4),
            };

            const nextSuggestionKey = `${nextSuggestion.mode}:${nextSuggestion.query}`;

            if (lastSuggestionRef.current !== nextSuggestionKey) {
                setRawActiveSuggestionIndex(0);
                lastSuggestionRef.current = nextSuggestionKey;
            }

            setSuggestion(nextSuggestion);
        },
        [containerRef],
    );

    const emitValue = useCallback(
        (editor: Editor): void => {
            const mentionAdminIds: number[] = [];
            const userRefs: TicketDescriptionValue['userRefs'] = [];

            editor.state.doc.descendants((node) => {
                if (node.type.name === 'adminMention') {
                    const id = Number.parseInt(
                        String(node.attrs.id ?? '0'),
                        10,
                    );

                    if (id > 0) {
                        mentionAdminIds.push(id);
                    }
                }

                if (node.type.name === 'userReference') {
                    const id = Number.parseInt(
                        String(node.attrs.id ?? '0'),
                        10,
                    );

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

            onChange({
                html: editor.getHTML(),
                text: editor.getText(),
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
            setIsEmpty(createdEditor.isEmpty);
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
            setIsEmpty(activeEditor.isEmpty);
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

        queueMicrotask(() => {
            syncToolbarState(editor);
            resolveSuggestion(editor);
            setIsEmpty(editor.isEmpty);
        });
    }, [editor, html, resolveSuggestion, syncToolbarState]);

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
            return;
        }

        const requestId = latestUserSearchRequestId.current + 1;
        latestUserSearchRequestId.current = requestId;
        queueMicrotask(() => {
            if (latestUserSearchRequestId.current === requestId) {
                setUserSearchLoading(true);
            }
        });

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

                    setUserSearchLoading(false);
                });
        }, 180);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [suggestion?.mode, suggestion?.query]);

    const canSearchUsers =
        suggestion?.mode === 'user' &&
        suggestion.query.trim().length >= 1 &&
        suggestion.query.trim().length <= 120;

    const visibleUserResults = useMemo(() => {
        return canSearchUsers ? userResults : [];
    }, [canSearchUsers, userResults]);
    const usersLoading = canSearchUsers ? userSearchLoading : false;

    const currentSuggestionCount =
        suggestion === null
            ? 0
            : suggestion.mode === 'admin'
              ? adminResults.length
              : visibleUserResults.length;

    const activeSuggestionIndex =
        currentSuggestionCount <= 0
            ? 0
            : Math.min(rawActiveSuggestionIndex, currentSuggestionCount - 1);

    const clearSuggestionState = useCallback((shouldFocusEditor: boolean): void => {
        setSuggestion(null);
        setUserResults([]);
        setUserSearchLoading(false);
        setRawActiveSuggestionIndex(0);
        lastSuggestionRef.current = null;

        if (shouldFocusEditor && editor !== null) {
            editor.commands.focus();
        }
    }, [editor]);

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

            clearSuggestionState(true);
        },
        [clearSuggestionState, editor, suggestion],
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

            clearSuggestionState(true);
        },
        [clearSuggestionState, editor, suggestion],
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

            const visibleUser = visibleUserResults[index];

            if (visibleUser !== undefined) {
                insertUserReference(visibleUser);
            }
        },
        [
            adminResults,
            insertAdminMention,
            insertUserReference,
            suggestion,
            visibleUserResults,
        ],
    );

    const executeCommand = useCallback(
        (command: () => void): void => {
            if (editor === null) {
                return;
            }

            command();
            editor.commands.focus();
            syncToolbarState(editor);
            resolveSuggestion(editor);
        },
        [editor, resolveSuggestion, syncToolbarState],
    );

    const handleSuggestionKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>): boolean => {
            if (editor === null || suggestion === null) {
                return false;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                clearSuggestionState(true);
                return true;
            }

            if (currentSuggestionCount <= 0) {
                return false;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setRawActiveSuggestionIndex((current) => {
                    return (current + 1) % currentSuggestionCount;
                });
                return true;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setRawActiveSuggestionIndex((current) => {
                    return (
                        (current - 1 + currentSuggestionCount) %
                        currentSuggestionCount
                    );
                });
                return true;
            }

            if (event.key === 'Tab') {
                event.preventDefault();
                setRawActiveSuggestionIndex((current) => {
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
            clearSuggestionState,
            currentSuggestionCount,
            editor,
            insertSuggestionByIndex,
            suggestion,
        ],
    );

    const handleEditorKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>): void => {
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
                clearSuggestionState(false);
            }
        },
        [clearSuggestionState, editor, handleSuggestionKeyDown, suggestion],
    );

    return {
        editor,
        isEmpty,
        suggestion,
        setSuggestion,
        activeSuggestionIndex,
        setActiveSuggestionIndex: setRawActiveSuggestionIndex,
        activeHeading,
        activeInlineState,
        adminResults,
        userResults: visibleUserResults,
        usersLoading,
        insertAdminMention,
        insertUserReference,
        executeCommand,
        handleEditorKeyDown,
        handleSuggestionKeyDown,
    };
}
