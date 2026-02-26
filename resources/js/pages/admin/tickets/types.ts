export type AdminOption = {
    id: number;
    name: string;
    email: string;
};

export type TicketActor = {
    id: number;
    name: string;
    email?: string;
    role?: string | null;
};

export type TicketAttachment = {
    id: number;
    ticket_id: number;
    display_name: string;
    extension: string | null;
    mime_type: string;
    size_bytes: number;
    download_url: string;
    uploaded_by_admin_id: number | null;
    uploaded_by_user_id: number | null;
    uploaded_by_admin: TicketActor | null;
    uploaded_by_user: TicketActor | null;
    created_at: string | null;
};

export type TicketAudit = {
    id: number;
    event_type: string;
    actor_admin: {
        id: number;
        name: string;
        email: string;
    } | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
};

export type TicketStatusKey = 'todo' | 'in_progress' | 'to_review' | 'done';
export type TicketType = 'bug' | 'feature' | 'chore' | 'support';
export type TicketImportance = 'low' | 'normal' | 'high' | 'urgent';
export type TicketSource = 'admin' | 'user';

export type TicketMessage = {
    id: number;
    ticket_id: number;
    body: string;
    author: {
        id: number;
        name: string;
        role: string;
    } | null;
    is_admin_author: boolean;
    created_at: string | null;
    updated_at: string | null;
};

export type TicketRecord = {
    id: number;
    title: string;
    description: unknown;
    source: TicketSource;
    status: TicketStatusKey;
    type: TicketType;
    importance: TicketImportance;
    assignee_admin_id: number | null;
    creator_admin_id: number | null;
    reporter_user_id: number | null;
    first_admin_response_at: string | null;
    has_admin_response: boolean;
    done_at: string | null;
    archived_at: string | null;
    archive_deadline_at: string | null;
    archiving_in_seconds: number | null;
    creator_admin: AdminOption | null;
    assignee_admin: AdminOption | null;
    reporter_user: TicketActor | null;
    attachments: TicketAttachment[];
    messages: TicketMessage[];
    internal_note: {
        id: number;
        content: string;
        updated_at: string | null;
    } | null;
    mentions: Array<{
        id: number;
        mentioned_admin_id: number;
        mentioned_by_admin_id: number;
        source: string;
        created_at: string | null;
    }>;
    updated_at: string | null;
    created_at: string | null;
};

export type BoardData = Record<TicketStatusKey, TicketRecord[]>;

export type Paginated<T> = {
    data: T[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type Filters = {
    search: string;
    assignee_admin_id: number;
    creator_admin_id: number;
    type: 'all' | TicketType;
    importance: 'all' | TicketImportance;
    source: 'all' | TicketSource;
    sort:
        | 'title'
        | 'status'
        | 'type'
        | 'importance'
        | 'created_at'
        | 'updated_at';
    direction: 'asc' | 'desc';
};

export type UserSearchResult = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export type RequestFieldErrors = Record<string, string[]>;

export type TicketSyncState = 'idle' | 'dirty' | 'syncing' | 'saved' | 'error';
