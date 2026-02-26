export type SupportTicketStatus = 'todo' | 'in_progress' | 'to_review' | 'done';
export type SupportTicketType = 'bug' | 'feature' | 'support' | 'chore';

export type SupportTicketActor = {
    id: number | string;
    name: string;
    email?: string;
    role?: string | null;
};

export type SupportTicketMessage = {
    id: number | string;
    ticket_id: number | string;
    body: string;
    author: {
        id: number | string;
        name: string;
        role: string;
    } | null;
    is_admin_author: boolean;
    created_at: string | null;
    updated_at: string | null;
};

export type SupportTicketAttachment = {
    id: number | string;
    ticket_id: number | string;
    uploaded_by_admin_id: number | string | null;
    uploaded_by_user_id: number | string | null;
    uploaded_by_admin: SupportTicketActor | null;
    uploaded_by_user: SupportTicketActor | null;
    original_name: string;
    display_name: string;
    extension: string | null;
    mime_type: string;
    size_bytes: number;
    download_url: string;
    created_at: string | null;
};

export type SupportTicketRecord = {
    id: number | string;
    title: string;
    description: unknown;
    source: 'user' | 'admin';
    status: SupportTicketStatus;
    type: SupportTicketType;
    importance: 'low' | 'normal' | 'high' | 'urgent';
    assignee_admin_id: number | string | null;
    creator_admin_id: number | string | null;
    reporter_user_id: number | string | null;
    first_admin_response_at: string | null;
    has_admin_response: boolean;
    done_at: string | null;
    archived_at: string | null;
    archive_deadline_at: string | null;
    archiving_in_seconds: number | null;
    creator_admin: SupportTicketActor | null;
    assignee_admin: SupportTicketActor | null;
    reporter_user: SupportTicketActor | null;
    attachments: SupportTicketAttachment[];
    messages: SupportTicketMessage[];
    updated_at: string | null;
    created_at: string | null;
};

export type SupportTicketBuckets = {
    active: SupportTicketRecord[];
    archived: SupportTicketRecord[];
};

export type SupportTicketStatusLabels = Record<SupportTicketStatus, string>;

export type SupportAttachmentLimits = {
    max_file_size_kb: number;
    max_files_per_ticket: number;
};

export type SupportRequestFieldErrors = Record<string, string[]>;
