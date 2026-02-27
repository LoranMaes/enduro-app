import { mergeAttributes, Node } from '@tiptap/core';

const tokenClassName =
    'mx-0.5 inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/90 px-1.5 py-0.5 text-[0.6875rem] font-medium text-zinc-200 hover:border-zinc-500';

export const AdminMentionNode = Node.create({
    name: 'adminMention',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element) => {
                    const raw = element.getAttribute('data-mention-admin-id');
                    return raw === null ? null : Number.parseInt(raw, 10);
                },
            },
            name: {
                default: '',
                parseHTML: (element) => {
                    return element.getAttribute('data-mention-admin-name') ?? '';
                },
            },
            email: {
                default: '',
                parseHTML: (element) => {
                    return element.getAttribute('data-mention-admin-email') ?? '';
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'button[data-mention-admin-id]' }];
    },

    renderHTML({ HTMLAttributes }) {
        const name = String(HTMLAttributes.name ?? '').trim();

        return [
            'button',
            mergeAttributes(
                {
                    type: 'button',
                    contenteditable: 'false',
                    tabindex: '0',
                    class: tokenClassName,
                    'data-mention-admin-id': HTMLAttributes.id,
                    'data-mention-admin-name': name,
                    'data-mention-admin-email': HTMLAttributes.email,
                },
                HTMLAttributes,
            ),
            `@${name}`,
        ];
    },

    renderText({ node }) {
        return `@${String(node.attrs.name ?? '').trim()}`;
    },
});

export const UserReferenceNode = Node.create({
    name: 'userReference',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element) => {
                    const raw = element.getAttribute('data-user-ref-id');
                    return raw === null ? null : Number.parseInt(raw, 10);
                },
            },
            name: {
                default: '',
                parseHTML: (element) => {
                    return element.getAttribute('data-user-ref-name') ?? '';
                },
            },
            email: {
                default: '',
                parseHTML: (element) => {
                    return element.getAttribute('data-user-ref-email') ?? '';
                },
            },
            role: {
                default: '',
                parseHTML: (element) => {
                    return element.getAttribute('data-user-ref-role') ?? '';
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'button[data-user-ref-id]' }];
    },

    renderHTML({ HTMLAttributes }) {
        const name = String(HTMLAttributes.name ?? '').trim();
        const email = String(HTMLAttributes.email ?? '').trim();

        return [
            'button',
            mergeAttributes(
                {
                    type: 'button',
                    contenteditable: 'false',
                    tabindex: '0',
                    class: tokenClassName,
                    'data-user-ref-id': HTMLAttributes.id,
                    'data-user-ref-name': name,
                    'data-user-ref-email': email,
                    'data-user-ref-role': HTMLAttributes.role,
                },
                HTMLAttributes,
            ),
            `${name} [${email}]`,
        ];
    },

    renderText({ node }) {
        const name = String(node.attrs.name ?? '').trim();
        const email = String(node.attrs.email ?? '').trim();

        return `${name} [${email}]`;
    },
});
