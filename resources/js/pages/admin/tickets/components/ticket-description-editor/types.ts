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

export type HeadingOption = 'p' | 'h1' | 'h2' | 'h3';

export type SuggestionState = {
    mode: 'admin' | 'user';
    query: string;
    from: number;
    to: number;
    left: number;
    top: number;
};

export type TicketDescriptionEditorProps = {
    label: string;
    html: string;
    placeholder: string;
    admins: MentionableAdmin[];
    className?: string;
    onChange: (value: TicketDescriptionValue) => void;
    searchUsers: (query: string) => Promise<MentionableUser[]>;
};
