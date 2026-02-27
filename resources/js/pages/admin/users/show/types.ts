export type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    status: string;
    plan_label: string;
    can_impersonate: boolean;
    is_current: boolean;
};

export type ActivityLogItem = {
    id: number;
    log_name: string;
    event: string | null;
    description: string;
    subject_type: string | null;
    subject_label: string | null;
    subject_id: number | null;
    causer_id: number | null;
    causer_name: string | null;
    created_at: string | null;
    properties: Record<string, unknown>;
    changes: {
        old: Record<string, unknown> | null;
        attributes: Record<string, unknown> | null;
    };
};

export type PaginatedLogs = {
    data: ActivityLogItem[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    meta?: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type AdminUserShowPageProps = {
    user: AdminUser;
    statusMessage?: string | null;
    backUrl: string;
    filters: {
        scope: 'causer' | 'subject' | 'all' | string;
        event: string | null;
        per_page: number;
    };
    scopeOptions: Array<{
        value: 'causer' | 'subject' | 'all' | string;
        label: string;
    }>;
    eventOptions: string[];
    logs: PaginatedLogs;
    suspension: {
        is_suspended: boolean;
        suspended_at: string | null;
        suspended_reason: string | null;
        suspended_by_name: string | null;
    };
};
