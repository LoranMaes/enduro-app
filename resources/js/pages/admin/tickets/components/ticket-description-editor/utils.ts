import type { Editor } from '@tiptap/react';
import type { SuggestionState } from './types';

export function getRootFontSize(): number {
    if (typeof window === 'undefined') {
        return 16;
    }

    const size = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );

    if (Number.isNaN(size) || size <= 0) {
        return 16;
    }

    return size;
}

export function detectSuggestionAtCaret(editor: Editor): SuggestionState | null {
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

export function consumeSlashCommand(editor: Editor): boolean {
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

export function initials(value: string): string {
    return value
        .split(' ')
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}
